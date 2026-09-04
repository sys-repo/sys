import { describe, expect, it, type t } from '../../-test.ts';
import { Fs } from '../mod.ts';
import { snapshotFile } from '../u/u.snapshot.file.ts';
import type { SnapshotHandle, SnapshotIo } from '../u/u.snapshot.io.ts';

const root = Fs.resolve('/snapshot-race-root') as t.StringAbsoluteDir;
const path = Fs.join(root, 'file') as t.StringAbsolutePath;
const options: t.Fs.Snapshot.File.Options = { root, path, maxBytes: 1, timeout: 10_000 };

function info(
  kind: 'file' | 'directory' | 'symlink' = 'file',
  overrides: Partial<Deno.FileInfo> = {},
): Deno.FileInfo {
  return {
    isFile: kind === 'file',
    isDirectory: kind === 'directory',
    isSymlink: kind === 'symlink',
    size: kind === 'file' ? 1 : 0,
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

type FixtureOptions = {
  readonly bytes?: Uint8Array;
  readonly pathBefore?: Deno.FileInfo;
  readonly handleBefore?: Deno.FileInfo;
  readonly pathAfterOpen?: Deno.FileInfo;
  readonly handleAfter?: Deno.FileInfo;
  readonly rootInfo?: Deno.FileInfo;
  readonly openFailure?: unknown;
  readonly readFailure?: unknown;
  readonly statFailureAt?: number;
  readonly lstatFailureAt?: number;
  readonly hostFailure?: unknown;
};

function fixture(input: FixtureOptions = {}): {
  readonly io: SnapshotIo;
  readonly state: { reads: number; closes: number };
} {
  const baseline = info();
  const pathStats = [input.pathBefore ?? baseline, input.pathAfterOpen ?? baseline];
  const handleStats = [input.handleBefore ?? baseline, input.handleAfter ?? baseline];
  const state = { reads: 0, closes: 0 };
  const bytes = input.bytes ?? new Uint8Array([42]);
  let pathLstats = 0;
  let stats = 0;
  let offset = 0;

  const handle: SnapshotHandle = {
    read(buffer) {
      state.reads++;
      if (input.readFailure !== undefined) return Promise.reject(input.readFailure);
      if (offset >= bytes.byteLength) return Promise.resolve(null);
      const count = Math.min(buffer.byteLength, bytes.byteLength - offset);
      buffer.set(bytes.subarray(offset, offset + count));
      offset += count;
      return Promise.resolve(count);
    },
    stat() {
      stats++;
      if (input.statFailureAt === stats) return Promise.reject(input.hostFailure);
      return Promise.resolve(handleStats[Math.min(stats - 1, handleStats.length - 1)]);
    },
    close() {
      state.closes++;
    },
  };

  const io: SnapshotIo = {
    lstat(selected) {
      if (selected === root) return Promise.resolve(input.rootInfo ?? info('directory'));
      pathLstats++;
      if (input.lstatFailureAt === pathLstats) return Promise.reject(input.hostFailure);
      return Promise.resolve(pathStats[Math.min(pathLstats - 1, pathStats.length - 1)]);
    },
    open() {
      if (input.openFailure !== undefined) return Promise.reject(input.openFailure);
      return Promise.resolve(handle);
    },
  };
  return { io, state };
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

describe('Fs.Snapshot: stable evidence and race rejection', () => {
  it('reports device-inode only when every final-file observation has stable identity', async () => {
    const strong = fixture();
    expect((await snapshotFile(options, strong.io)).evidence).to.eql('device-inode');

    const unavailable = fixture({
      handleAfter: info('file', {
        dev: null as unknown as number,
        ino: null as unknown as number,
      }),
    });
    expect((await snapshotFile(options, unavailable.io)).evidence).to.eql('metadata-only');

    const invalid = fixture({
      pathAfterOpen: info('file', { dev: -1, ino: Number.MAX_SAFE_INTEGER + 1 }),
    });
    expect((await snapshotFile(options, invalid.io)).evidence).to.eql('metadata-only');
  });

  it('rejects device and inode drift before exposing bytes', async () => {
    const fallbackMismatch = fixture({
      pathBefore: info('file', {
        dev: null as unknown as number,
        ino: null as unknown as number,
      }),
      pathAfterOpen: info('file', { ino: 12 }),
    });
    await expectFailure(snapshotFile(options, fallbackMismatch.io), 'source-changed');
    expect(fallbackMismatch.state.closes).to.eql(1);

    for (
      const changed of [
        info('file', { dev: 8 }),
        info('file', { ino: 12 }),
      ]
    ) {
      const current = fixture({ handleAfter: changed });
      await expectFailure(snapshotFile(options, current.io), 'source-changed');
      expect(current.state.reads).to.be.greaterThan(0);
      expect(current.state.closes).to.eql(1);
    }
  });

  it('rejects size, mtime, and ctime drift across path and handle observations', async () => {
    const cases: readonly FixtureOptions[] = [
      { handleBefore: info('file', { size: 2 }) },
      { pathAfterOpen: info('file', { mtime: new Date(2_000) }) },
      { handleAfter: info('file', { ctime: new Date(2_000) }) },
      {
        pathBefore: info('file', {
          dev: null as unknown as number,
          ino: null as unknown as number,
        }),
        handleAfter: info('file', { mtime: new Date(2_000) }),
      },
    ];
    for (const input of cases) {
      const current = fixture(input);
      await expectFailure(snapshotFile(options, current.io), 'source-changed');
      expect(current.state.closes).to.eql(1);
    }
  });

  it('rejects byte extents that contradict otherwise stable metadata', async () => {
    for (
      const [size, bytes] of [
        [4, new Uint8Array([1, 2])],
        [1, new Uint8Array([1, 2])],
      ] as const
    ) {
      const stable = info('file', { size });
      const current = fixture({
        bytes,
        pathBefore: stable,
        pathAfterOpen: stable,
        handleBefore: stable,
        handleAfter: stable,
      });
      await expectFailure(
        snapshotFile({ ...options, maxBytes: 4 }, current.io),
        'source-changed',
      );
      expect(current.state.closes).to.eql(1);
    }
  });

  it('rejects unsafe root, path, and handle type transitions', async () => {
    for (
      const input of [
        { rootInfo: info('symlink') },
        { pathBefore: info('directory') },
        { handleBefore: info('symlink') },
        { pathAfterOpen: info('directory') },
        { handleAfter: info('directory') },
      ] as const
    ) {
      const current = fixture(input);
      await expectFailure(snapshotFile(options, current.io), 'unsafe-filesystem');
      expect(current.state.closes).to.be.lessThanOrEqual(1);
    }
  });

  it('maps recognized missing and permission errors and normalizes every other host failure', async () => {
    const cases = [
      [new Deno.errors.NotFound('native details'), 'missing'],
      [new Deno.errors.NotADirectory('native details'), 'unsafe-filesystem'],
      [new Deno.errors.IsADirectory('native details'), 'unsafe-filesystem'],
      [new Deno.errors.FilesystemLoop('native details'), 'unsafe-filesystem'],
      [new Deno.errors.PermissionDenied('native details'), 'permission-denied'],
      [new Deno.errors.NotCapable('native details'), 'permission-denied'],
      [new Error('native details'), 'io-failure'],
    ] as const;

    for (const [cause, kind] of cases) {
      const current = fixture({ openFailure: cause });
      const error = await expectFailure(snapshotFile(options, current.io), kind);
      expect(error.message.includes('native details')).to.eql(false);
      expect(Object.hasOwn(error, 'cause')).to.eql(false);
      expect(current.state.closes).to.eql(0);
    }
  });

  it('closes once when post-open lstat, fstat, or read fails', async () => {
    const cases: ReadonlyArray<
      readonly [FixtureOptions, t.Fs.Snapshot.Failure.Kind]
    > = [
      [{ lstatFailureAt: 2, hostFailure: new Deno.errors.NotFound('gone') }, 'missing'],
      [
        { lstatFailureAt: 2, hostFailure: new Deno.errors.NotADirectory('replaced') },
        'unsafe-filesystem',
      ],
      [
        { lstatFailureAt: 2, hostFailure: new Deno.errors.IsADirectory('replaced') },
        'unsafe-filesystem',
      ],
      [
        { lstatFailureAt: 2, hostFailure: new Deno.errors.FilesystemLoop('replaced') },
        'unsafe-filesystem',
      ],
      [{ statFailureAt: 1, hostFailure: new Error('fstat') }, 'io-failure'],
      [{ statFailureAt: 2, hostFailure: new Error('fstat') }, 'io-failure'],
      [{ readFailure: new Error('read') }, 'io-failure'],
    ];
    for (const [input, kind] of cases) {
      const current = fixture(input);
      await expectFailure(snapshotFile(options, current.io), kind);
      expect(current.state.closes).to.eql(1);
    }
  });
});
