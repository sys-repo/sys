import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Fs } from '../mod.ts';
import { normalizedPath } from '../u/u.snapshot.input.ts';

const timeout = 10_000;

async function expectFailure(
  promise: Promise<unknown>,
  kind: t.Fs.Snapshot.Failure.Kind,
): Promise<t.Fs.Snapshot.Failure.Error> {
  let failure: unknown;
  try {
    await promise;
  } catch (cause) {
    failure = cause;
  }
  expect(Fs.Snapshot.Is.failure(failure)).to.eql(true);
  if (!Fs.Snapshot.Is.failure(failure)) throw new Error('Expected FsSnapshotError.');
  expect(failure.kind).to.eql(kind);
  return failure;
}

function call(input: unknown): Promise<t.Fs.Snapshot.File.Result> {
  return Fs.Snapshot.file(input as t.Fs.Snapshot.File.Options);
}

describe('Fs.Snapshot: bounded stable file snapshots', () => {
  it('exposes frozen typed runtime libraries', () => {
    expect(Object.keys(Fs.Snapshot)).to.eql(['Is', 'file']);
    expect(Object.keys(Fs.Snapshot.Is)).to.eql(['failure']);
    expect(Object.isFrozen(Fs.Snapshot)).to.eql(true);
    expect(Object.isFrozen(Fs.Snapshot.Is)).to.eql(true);
    expectTypeOf(Fs.Snapshot.file).toEqualTypeOf<t.Fs.Snapshot.File.Method>();
  });

  it('returns a frozen exact record with mutable, exact, exclusively owned bytes', async () => {
    const root = await Deno.makeTempDir({ prefix: 'sys-fs-snapshot-' });
    const path = Fs.join(root, 'source.bin') as t.StringAbsolutePath;
    const source = new Uint8Array([1, 2, 3, 4]);

    try {
      await Deno.writeFile(path, source);
      const options: t.Fs.Snapshot.File.Options = {
        root,
        path,
        maxBytes: source.byteLength,
        timeout,
      };
      const snapshot: t.Fs.Snapshot.File.Result = await Fs.Snapshot.file(options);

      expect(snapshot).to.include({ path, byteLength: 4 });
      expect(['device-inode', 'metadata-only']).to.include(snapshot.evidence);
      expect(snapshot.bytes).to.eql(source);
      expect(Object.keys(snapshot)).to.eql(['path', 'byteLength', 'evidence', 'bytes']);
      expect(Object.isFrozen(snapshot)).to.eql(true);
      expect(Object.isFrozen(snapshot.bytes)).to.eql(false);
      expect(Object.getPrototypeOf(snapshot.bytes)).to.equal(Uint8Array.prototype);
      expect(Object.getPrototypeOf(snapshot.bytes.buffer)).to.equal(ArrayBuffer.prototype);
      expect(snapshot.bytes.byteOffset).to.eql(0);
      expect(snapshot.bytes.buffer.byteLength).to.eql(snapshot.byteLength);
      expect((snapshot.bytes.buffer as ArrayBuffer).resizable).to.eql(false);
      expect((snapshot.bytes.buffer as ArrayBuffer).detached).to.eql(false);
      expectTypeOf(snapshot).toEqualTypeOf<t.Fs.Snapshot.File.Result>();

      snapshot.bytes[0] = 99;
      expect(await Deno.readFile(path)).to.eql(source);
      await Deno.writeFile(path, new Uint8Array([8, 8, 8, 8]));
      expect(snapshot.bytes).to.eql(new Uint8Array([99, 2, 3, 4]));
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });

  it('normalizes the selected absolute path and enforces exact cap-plus-one limits', async () => {
    const root = await Deno.makeTempDir({ prefix: 'sys-fs-snapshot-limit-' });
    const empty = Fs.join(root, 'empty') as t.StringAbsolutePath;
    const full = Fs.join(root, 'full') as t.StringAbsolutePath;
    try {
      await Deno.writeFile(empty, new Uint8Array());
      await Deno.writeFile(full, new Uint8Array([1, 2, 3]));

      const emptyResult = await Fs.Snapshot.file({ root, path: empty, maxBytes: 0, timeout });
      expect(emptyResult.byteLength).to.eql(0);
      expect(emptyResult.bytes.buffer.byteLength).to.eql(0);

      const normalized = await Fs.Snapshot.file({
        root: Fs.join(root, '.'),
        path: Fs.join(root, 'child', '..', 'full'),
        maxBytes: 3,
        timeout,
      });
      expect(normalized.path).to.eql(full);
      expect(normalized.bytes).to.eql(new Uint8Array([1, 2, 3]));

      await expectFailure(
        Fs.Snapshot.file({ root, path: full, maxBytes: 2, timeout }),
        'source-limit',
      );
      await expectFailure(
        Fs.Snapshot.file({ root, path: full, maxBytes: 0, timeout }),
        'source-limit',
      );
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });

  it('snapshots exact option values synchronously without invoking accessors or proxy traps', async () => {
    const root = await Deno.makeTempDir({ prefix: 'sys-fs-snapshot-input-' });
    const first = Fs.join(root, 'first') as t.StringAbsolutePath;
    const second = Fs.join(root, 'second') as t.StringAbsolutePath;
    try {
      await Deno.writeFile(first, new Uint8Array([1]));
      await Deno.writeFile(second, new Uint8Array([2]));

      const options: t.Fs.Snapshot.File.Options = {
        root,
        path: first,
        maxBytes: 1,
        timeout,
      };
      const pending = Fs.Snapshot.file(options);
      options.root = '/changed' as t.StringAbsoluteDir;
      options.path = second;
      options.maxBytes = 0;
      options.timeout = 0;
      expect((await pending).bytes).to.eql(new Uint8Array([1]));

      let getterInvoked = false;
      const accessor = { path: first, maxBytes: 1, timeout };
      Object.defineProperty(accessor, 'root', {
        enumerable: true,
        get() {
          getterInvoked = true;
          return root;
        },
      });
      await expectFailure(call(accessor), 'invalid-options');
      expect(getterInvoked).to.eql(false);

      let trapInvoked = false;
      const proxied = new Proxy(
        { root, path: first, maxBytes: 1, timeout },
        {
          get() {
            trapInvoked = true;
            throw new Error('trap');
          },
          ownKeys() {
            trapInvoked = true;
            throw new Error('trap');
          },
        },
      );
      await expectFailure(call(proxied), 'invalid-options');
      expect(trapInvoked).to.eql(false);

      await expectFailure(
        call({ root, path: first, maxBytes: 1, timeout, extra: true }),
        'invalid-options',
      );
      await expectFailure(
        call(
          Object.assign(Object.create({ inherited: true }), {
            root,
            path: first,
            maxBytes: 1,
            timeout,
          }),
        ),
        'invalid-options',
      );
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });

  it('rejects invalid roots, paths, finite limits, and non-descendant selections', async () => {
    const root = Fs.resolve('/tmp', 'sys-fs-snapshot-admission') as t.StringAbsoluteDir;
    const inside = Fs.join(root, 'source') as t.StringAbsolutePath;
    const outside = Fs.resolve(root, '..', 'outside') as t.StringAbsolutePath;
    const overlong = `/${'a'.repeat(32_768)}`;

    await expectFailure(call({ path: inside, maxBytes: 0, timeout }), 'invalid-options');
    await expectFailure(call({ root: '', path: inside, maxBytes: 0, timeout }), 'invalid-root');
    await expectFailure(call({ root: 42, path: inside, maxBytes: 0, timeout }), 'invalid-root');
    await expectFailure(
      call({ root: 'relative', path: inside, maxBytes: 0, timeout }),
      'invalid-root',
    );
    await expectFailure(
      call({ root: `${root}\0`, path: inside, maxBytes: 0, timeout }),
      'invalid-root',
    );
    await expectFailure(
      call({ root: overlong, path: inside, maxBytes: 0, timeout }),
      'invalid-root',
    );
    await expectFailure(call({ root, path: '', maxBytes: 0, timeout }), 'invalid-path');
    await expectFailure(call({ root, path: 42, maxBytes: 0, timeout }), 'invalid-path');
    await expectFailure(call({ root, path: 'relative', maxBytes: 0, timeout }), 'invalid-path');
    await expectFailure(call({ root, path: `${inside}\0`, maxBytes: 0, timeout }), 'invalid-path');
    await expectFailure(call({ root, path: overlong, maxBytes: 0, timeout }), 'invalid-path');
    await expectFailure(call({ root, path: root, maxBytes: 0, timeout }), 'invalid-path');
    await expectFailure(call({ root, path: outside, maxBytes: 0, timeout }), 'invalid-path');

    const exactNormalized = 'a'.repeat(32_768);
    expect(normalizedPath(exactNormalized, 'invalid-path')).to.equal(exactNormalized);
    await expectFailure(
      Promise.resolve().then(() => normalizedPath(`${exactNormalized}a`, 'invalid-root')),
      'invalid-root',
    );
    await expectFailure(
      Promise.resolve().then(() => normalizedPath(`${exactNormalized}a`, 'invalid-path')),
      'invalid-path',
    );

    for (
      const maxBytes of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER]
    ) {
      await expectFailure(call({ root, path: inside, maxBytes, timeout }), 'invalid-options');
    }
    for (const value of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      await expectFailure(
        call({ root, path: inside, maxBytes: 0, timeout: value }),
        'invalid-options',
      );
    }
  });

  it('rejects symlinked roots, ancestors, and final files without following them', async () => {
    const workspace = await Deno.makeTempDir({ prefix: 'sys-fs-snapshot-link-' });
    const root = Fs.join(workspace, 'root') as t.StringAbsoluteDir;
    const outside = Fs.join(workspace, 'outside') as t.StringAbsoluteDir;
    const rootLink = Fs.join(workspace, 'root-link') as t.StringAbsoluteDir;
    try {
      await Deno.mkdir(root);
      await Deno.mkdir(outside);
      await Deno.writeFile(Fs.join(outside, 'file'), new Uint8Array([1]));
      await Deno.symlink(root, rootLink, { type: 'dir' });
      await Deno.symlink(outside, Fs.join(root, 'ancestor'), { type: 'dir' });
      await Deno.symlink(Fs.join(outside, 'file'), Fs.join(root, 'final'), { type: 'file' });

      await expectFailure(
        Fs.Snapshot.file({
          root: rootLink,
          path: Fs.join(rootLink, 'file'),
          maxBytes: 1,
          timeout,
        }),
        'unsafe-filesystem',
      );
      await expectFailure(
        Fs.Snapshot.file({
          root,
          path: Fs.join(root, 'ancestor', 'file'),
          maxBytes: 1,
          timeout,
        }),
        'unsafe-filesystem',
      );
      await expectFailure(
        Fs.Snapshot.file({ root, path: Fs.join(root, 'final'), maxBytes: 1, timeout }),
        'unsafe-filesystem',
      );
    } finally {
      await Deno.remove(workspace, { recursive: true });
    }
  });

  it('authenticates fixed frozen failures without trusting structural lookalikes', async () => {
    const root = await Deno.makeTempDir({ prefix: 'sys-fs-snapshot-failure-' });
    const path = Fs.join(root, 'missing') as t.StringAbsolutePath;
    try {
      const error = await expectFailure(
        Fs.Snapshot.file({ root, path, maxBytes: 0, timeout }),
        'missing',
      );
      expect(error.name).to.eql('FsSnapshotError');
      expect(error.operation).to.eql('file');
      expect(error.message).to.eql('Filesystem snapshot source is missing');
      expect(error.message.includes(root)).to.eql(false);
      expect(Object.hasOwn(error, 'cause')).to.eql(false);
      expect(Object.keys(error)).to.eql(['name', 'operation', 'kind']);
      expect(Object.isFrozen(error)).to.eql(true);

      const lookalike = Object.assign(new Error(error.message), {
        name: 'FsSnapshotError',
        operation: 'file',
        kind: 'missing',
      });
      expect(Fs.Snapshot.Is.failure(lookalike)).to.eql(false);

      let trapped = false;
      const proxy = new Proxy(error, {
        get() {
          trapped = true;
          throw new Error('trap');
        },
      });
      expect(Fs.Snapshot.Is.failure(proxy)).to.eql(false);
      expect(trapped).to.eql(false);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });

  it('bounds and snapshots nested cancellation fan-in', async () => {
    const root = await Deno.makeTempDir({ prefix: 'sys-fs-snapshot-until-' });
    const path = Fs.join(root, 'file') as t.StringAbsolutePath;
    try {
      await Deno.writeFile(path, new Uint8Array([1]));
      const controller = new AbortController();
      const until: t.UntilInput[] = [controller.signal];
      const pending = Fs.Snapshot.file({ root, path, maxBytes: 1, timeout, until });
      until[0] = AbortSignal.abort();
      expect((await pending).bytes).to.eql(new Uint8Array([1]));

      const accepted = new AbortController();
      accepted.abort();
      let nested: t.UntilInput = accepted.signal;
      for (let index = 0; index < 32; index++) nested = [nested];
      await expectFailure(
        Fs.Snapshot.file({ root, path, maxBytes: 1, timeout, until: nested }),
        'cancelled',
      );

      nested = accepted.signal;
      for (let index = 0; index < 33; index++) nested = [nested];
      await expectFailure(
        Fs.Snapshot.file({ root, path, maxBytes: 1, timeout, until: nested }),
        'invalid-options',
      );

      const withinNodeLimit = [
        accepted.signal,
        ...Array.from({ length: 254 }, () => new AbortController().signal),
      ];
      await expectFailure(
        Fs.Snapshot.file({ root, path, maxBytes: 1, timeout, until: withinNodeLimit }),
        'cancelled',
      );
      const overNodeLimit = [...withinNodeLimit, new AbortController().signal];
      await expectFailure(
        Fs.Snapshot.file({ root, path, maxBytes: 1, timeout, until: overNodeLimit }),
        'invalid-options',
      );

      const cycle: t.UntilInput[] = [];
      cycle.push(cycle);
      await expectFailure(
        Fs.Snapshot.file({ root, path, maxBytes: 1, timeout, until: cycle }),
        'invalid-options',
      );
      const sparse = new Array(1) as t.UntilInput[];
      await expectFailure(
        Fs.Snapshot.file({ root, path, maxBytes: 1, timeout, until: sparse }),
        'invalid-options',
      );

      let getterInvoked = false;
      const accessorUntil: unknown[] = [];
      Object.defineProperty(accessorUntil, '0', {
        enumerable: true,
        configurable: true,
        get() {
          getterInvoked = true;
          return controller.signal;
        },
      });
      accessorUntil.length = 1;
      await expectFailure(
        call({ root, path, maxBytes: 1, timeout, until: accessorUntil }),
        'invalid-options',
      );
      expect(getterInvoked).to.eql(false);

      await expectFailure(
        call({
          root,
          path,
          maxBytes: 1,
          timeout,
          until: Object.assign([controller.signal], { extra: true }),
        }),
        'invalid-options',
      );

      let proxyTrap = false;
      const proxyUntil = new Proxy(controller.signal, {
        get() {
          proxyTrap = true;
          throw new Error('trap');
        },
      });
      await expectFailure(
        call({ root, path, maxBytes: 1, timeout, until: proxyUntil }),
        'invalid-options',
      );
      const proxyPrototypeUntil = Object.create(
        new Proxy({}, {
          get() {
            proxyTrap = true;
            throw new Error('trap');
          },
        }),
      );
      await expectFailure(
        call({ root, path, maxBytes: 1, timeout, until: proxyPrototypeUntil }),
        'invalid-options',
      );
      expect(proxyTrap).to.eql(false);
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });
});
