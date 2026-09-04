import { describe, expect, it, Rx, type t, Time } from '../../-test.ts';
import { Fs } from '../mod.ts';
import { snapshotFile } from '../u/u.snapshot.file.ts';
import type { SnapshotHandle, SnapshotIo } from '../u/u.snapshot.io.ts';

const root = Fs.resolve('/snapshot-root') as t.StringAbsoluteDir;
const path = Fs.join(root, 'file') as t.StringAbsolutePath;
const separator = Deno.build.os === 'windows' ? '\\' : '/';
const timeout = 10_000;

function info(
  kind: 'file' | 'directory' = 'file',
  overrides: Partial<Deno.FileInfo> = {},
): Deno.FileInfo {
  return {
    isFile: kind === 'file',
    isDirectory: kind === 'directory',
    isSymlink: false,
    size: kind === 'file' ? 4 : 0,
    mtime: new Date(1_000),
    atime: new Date(1_000),
    birthtime: new Date(1_000),
    ctime: new Date(1_000),
    dev: 7,
    ino: kind === 'file' ? 11 : 3,
    mode: 0,
    nlink: 1,
    uid: 0,
    gid: 0,
    rdev: 0,
    blksize: 4_096,
    blocks: 1,
    isBlockDevice: false,
    isCharDevice: false,
    isFifo: false,
    isSocket: false,
    ...overrides,
  } as Deno.FileInfo;
}

type Harness = {
  readonly io: SnapshotIo;
  readonly reads: number[];
  readonly lstats: string[];
  readonly state: {
    opens: number;
    stats: number;
    closes: number;
  };
};

type HarnessOptions = {
  readonly bytes?: Uint8Array;
  readonly pathStats?: readonly Deno.FileInfo[];
  readonly handleStats?: readonly Deno.FileInfo[];
  readonly onOpen?: () => void | Promise<void>;
  readonly onRead?: (buffer: Uint8Array, fallback: () => number | null) => Promise<number | null>;
  readonly onClose?: () => void | Promise<void>;
};

function harness(options: HarnessOptions = {}): Harness {
  const bytes = options.bytes ?? new Uint8Array([1, 2, 3, 4]);
  const baseline = info('file', { size: bytes.byteLength });
  const pathStats = [...(options.pathStats ?? [baseline, baseline])];
  const handleStats = [...(options.handleStats ?? [baseline, baseline])];
  const reads: number[] = [];
  const lstats: string[] = [];
  const state = { opens: 0, stats: 0, closes: 0 };
  let offset = 0;

  const handle: SnapshotHandle = {
    async read(buffer) {
      reads.push(buffer.byteLength);
      const fallback = () => {
        if (offset >= bytes.byteLength) return null;
        const count = Math.min(buffer.byteLength, bytes.byteLength - offset);
        buffer.set(bytes.subarray(offset, offset + count));
        offset += count;
        return count;
      };
      return options.onRead ? await options.onRead(buffer, fallback) : fallback();
    },
    stat() {
      const current = handleStats[Math.min(state.stats, handleStats.length - 1)];
      state.stats++;
      return Promise.resolve(current);
    },
    async close() {
      state.closes++;
      await options.onClose?.();
    },
  };

  const io: SnapshotIo = {
    lstat(selected) {
      lstats.push(selected);
      if (selected === root) return Promise.resolve(info('directory'));
      const index = lstats.filter((value) => value === path).length - 1;
      return Promise.resolve(pathStats[Math.min(index, pathStats.length - 1)]);
    },
    async open(selected) {
      expect(selected).to.eql(path);
      state.opens++;
      await options.onOpen?.();
      return handle;
    },
  };
  return { io, reads, lstats, state };
}

function options(overrides: Partial<t.Fs.Snapshot.File.Options> = {}) {
  return { root, path, maxBytes: 4, timeout, ...overrides };
}

async function expectFailure(
  promise: Promise<unknown>,
  kind: t.Fs.Snapshot.Failure.Kind,
): Promise<t.Fs.Snapshot.Failure.Error> {
  let cause: unknown;
  try {
    await promise;
  } catch (error) {
    cause = error;
  }
  expect(Fs.Snapshot.Is.failure(cause)).to.eql(true);
  if (!Fs.Snapshot.Is.failure(cause)) throw new Error('Expected FsSnapshotError.');
  expect(cause.kind).to.eql(kind);
  return cause;
}

describe('Fs.Snapshot: bounded work and lifecycle', () => {
  it('uses one handle, never reopens the path, and caps every read at 64 KiB', async () => {
    const bytes = new Uint8Array(2 * 64 * 1024);
    bytes.fill(7);
    const fixture = harness({ bytes });
    const result = await snapshotFile(
      options({ maxBytes: bytes.byteLength }),
      fixture.io,
    );

    expect(result.bytes).to.eql(bytes);
    expect(fixture.state).to.eql({ opens: 1, stats: 2, closes: 1 });
    expect(fixture.reads).to.eql([64 * 1024, 64 * 1024, 1]);
    expect(fixture.lstats).to.eql([root, path, path]);
  });

  it('enforces the source cap with one additional byte of bounded evidence', async () => {
    const bytes = new Uint8Array(2 * 64 * 1024 + 1);
    const fixture = harness({ bytes });
    await expectFailure(
      snapshotFile(options({ maxBytes: bytes.byteLength - 1 }), fixture.io),
      'source-limit',
    );
    expect(fixture.reads).to.eql([64 * 1024, 64 * 1024, 1]);
    expect(fixture.state.opens).to.eql(1);
    expect(fixture.state.closes).to.eql(1);
  });

  it('fills bounded slabs across legal short reads', async () => {
    const bytes = new Uint8Array(64 * 1024 + 1);
    bytes.fill(7);
    const backings = new Set<ArrayBufferLike>();
    let offset = 0;
    const fixture = harness({
      bytes,
      onRead(buffer) {
        backings.add(buffer.buffer);
        if (offset >= bytes.byteLength) return Promise.resolve(null);
        const count = Math.min(1024, buffer.byteLength, bytes.byteLength - offset);
        buffer.set(bytes.subarray(offset, offset + count));
        offset += count;
        return Promise.resolve(count);
      },
    });

    const result = await snapshotFile(options({ maxBytes: bytes.byteLength }), fixture.io);
    expect(result.bytes).to.eql(bytes);
    expect(backings.size).to.eql(2);
    expect(fixture.state.closes).to.eql(1);
  });

  it('admits exact package ceilings and checked safe-integer boundaries', async () => {
    const ceilingRoot = Fs.resolve('/r') as t.StringAbsoluteDir;
    const available = 32_768 - ceilingRoot.length;
    const exactPath = `${ceilingRoot}${separator}${
      'a'.repeat(available - 1)
    }` as t.StringAbsolutePath;
    const redundant = `${separator}.`;
    const exactRoot = `${ceilingRoot}${redundant.repeat(Math.floor(available / 2))}${
      available % 2 === 0 ? '' : separator
    }` as t.StringAbsoluteDir;
    const child = Fs.join(ceilingRoot, 'file') as t.StringAbsolutePath;
    const empty = info('file', { size: 0 });
    let closes = 0;
    const handle: SnapshotHandle = {
      read() {
        return Promise.resolve(null);
      },
      stat() {
        return Promise.resolve(empty);
      },
      close() {
        closes++;
      },
    };
    const io: SnapshotIo = {
      lstat(selected) {
        return Promise.resolve(selected === ceilingRoot ? info('directory') : empty);
      },
      open() {
        return Promise.resolve(handle);
      },
    };

    const selected = await snapshotFile(
      {
        root: ceilingRoot,
        path: exactPath,
        maxBytes: Number.MAX_SAFE_INTEGER - 1,
        timeout: Number.MAX_SAFE_INTEGER,
      },
      io,
    );
    expect(selected.path.length).to.eql(32_768);
    expect(selected.byteLength).to.eql(0);

    const normalizedRoot = await snapshotFile(
      { root: exactRoot, path: child, maxBytes: 0, timeout },
      io,
    );
    expect(exactRoot.length).to.eql(32_768);
    expect(normalizedRoot.path).to.eql(child);
    expect(closes).to.eql(2);
  });

  it('settles pre-cancellation and zero deadlines before filesystem IO', async () => {
    let ioCalls = 0;
    const io: SnapshotIo = {
      lstat() {
        ioCalls++;
        throw new Error('unexpected');
      },
      open() {
        ioCalls++;
        throw new Error('unexpected');
      },
    };

    await expectFailure(
      snapshotFile(options({ until: AbortSignal.abort() }), io),
      'cancelled',
    );
    const life = Rx.lifecycle();
    life.dispose();
    await expectFailure(snapshotFile(options({ until: life }), io), 'cancelled');

    let synchronousUnsubscribed = false;
    const synchronous = {
      subscribe(next: (value: unknown) => void) {
        next(undefined);
        return {
          closed: false,
          unsubscribe() {
            synchronousUnsubscribed = true;
          },
        };
      },
    } as t.UntilInput;
    await expectFailure(snapshotFile(options({ until: synchronous }), io), 'cancelled');
    expect(synchronousUnsubscribed).to.eql(true);

    let leafGetters = 0;
    let getterLeafUnsubscribed = false;
    const getterLeaf = {} as Record<string, unknown>;
    Object.defineProperty(getterLeaf, 'subscribe', {
      enumerable: true,
      get() {
        leafGetters++;
        return (next: (value: unknown) => void) => {
          next(undefined);
          return {
            closed: false,
            unsubscribe() {
              getterLeafUnsubscribed = true;
            },
          };
        };
      },
    });
    await expectFailure(
      snapshotFile(options({ until: getterLeaf as t.UntilInput }), io),
      'cancelled',
    );
    expect(leafGetters).to.be.greaterThan(0);
    expect(getterLeafUnsubscribed).to.eql(true);

    const broken = {
      subscribe() {
        throw new Error('subscription setup failed');
      },
    } as unknown as t.UntilInput;
    await expectFailure(snapshotFile(options({ until: broken }), io), 'invalid-options');
    await expectFailure(snapshotFile(options({ timeout: 0 }), io), 'timeout');
    expect(ioCalls).to.eql(0);
  });

  it('counts undefined cancellation slots and exact nested array levels before IO', async () => {
    let ioCalls = 0;
    const io: SnapshotIo = {
      lstat() {
        ioCalls++;
        throw new Error('unexpected');
      },
      open() {
        ioCalls++;
        throw new Error('unexpected');
      },
    };

    const exactNodes = Array.from({ length: 255 }, () => undefined);
    await expectFailure(
      snapshotFile(options({ until: exactNodes, timeout: 0 }), io),
      'timeout',
    );
    const excessNodes = Array.from({ length: 256 }, () => undefined);
    await expectFailure(
      snapshotFile(options({ until: excessNodes, timeout: 0 }), io),
      'invalid-options',
    );

    let exactDepth: t.UntilInput = undefined;
    for (let index = 0; index < 32; index++) exactDepth = [exactDepth];
    await expectFailure(
      snapshotFile(options({ until: exactDepth, timeout: 0 }), io),
      'timeout',
    );
    let excessDepth: t.UntilInput = undefined;
    for (let index = 0; index < 33; index++) excessDepth = [excessDepth];
    await expectFailure(
      snapshotFile(options({ until: excessDepth, timeout: 0 }), io),
      'invalid-options',
    );
    expect(ioCalls).to.eql(0);
  });

  it('disposes a live cancellation subscription before successful settlement', async () => {
    let unsubscribed = false;
    const never = {
      subscribe() {
        return {
          closed: false,
          unsubscribe() {
            unsubscribed = true;
          },
        };
      },
    } as t.UntilInput;
    const current = harness();
    await snapshotFile(options({ until: never }), current.io);
    expect(unsubscribed).to.eql(true);
    expect(current.state.closes).to.eql(1);
  });

  it('observes cancellation and deadlines around pending IO and still closes once', async () => {
    const openingController = new AbortController();
    const opening = harness({
      onOpen() {
        openingController.abort('opening');
      },
    });
    await expectFailure(
      snapshotFile(options({ until: openingController.signal }), opening.io),
      'cancelled',
    );
    expect(opening.state.closes).to.eql(1);

    const controller = new AbortController();
    const cancelled = harness({
      onRead() {
        controller.abort('stop');
        return Promise.resolve(null);
      },
    });
    const cancellation = await expectFailure(
      snapshotFile(options({ until: controller.signal }), cancelled.io),
      'cancelled',
    );
    expect(Object.hasOwn(cancellation, 'cause')).to.eql(false);
    expect(cancelled.state.closes).to.eql(1);

    const timedOut = harness({
      async onRead() {
        await Time.wait(50);
        return null;
      },
    });
    await expectFailure(
      snapshotFile(options({ timeout: 25 }), timedOut.io),
      'timeout',
    );
    expect(timedOut.state.closes).to.eql(1);
  });

  it('settles close before rejection and preserves an earlier terminal cause', async () => {
    let closeSettled = false;
    const earlier = harness({
      onRead() {
        return Promise.reject(new Deno.errors.NotFound('gone'));
      },
      async onClose() {
        await Time.wait(1);
        closeSettled = true;
        throw new Error('later close failure');
      },
    });
    await expectFailure(snapshotFile(options(), earlier.io), 'missing');
    expect(closeSettled).to.eql(true);
    expect(earlier.state.closes).to.eql(1);

    for (
      const cause of [
        new Error('close failure'),
        new Deno.errors.NotFound('close failure'),
        new Deno.errors.PermissionDenied('close failure'),
      ]
    ) {
      const closeOnly = harness({
        onClose() {
          throw cause;
        },
      });
      const error = await expectFailure(snapshotFile(options(), closeOnly.io), 'io-failure');
      expect(Object.hasOwn(error, 'cause')).to.eql(false);
      expect(closeOnly.state.closes).to.eql(1);
    }
  });

  it('gives cancellation precedence when it becomes authoritative during close', async () => {
    const controller = new AbortController();
    const fixture = harness({
      onClose() {
        controller.abort();
        throw new Error('close failure');
      },
    });
    await expectFailure(
      snapshotFile(options({ until: controller.signal }), fixture.io),
      'cancelled',
    );
    expect(fixture.state.closes).to.eql(1);
  });
});
