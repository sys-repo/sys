import {
  createRooted,
  DEFAULT_IO,
  describe,
  directoryTarget,
  expect,
  expectFailure,
  expectWriteFailure,
  Fs,
  it,
  OPTIONS,
  setup,
  type t,
  teardown,
  treeFile,
  withIo,
  wrapFile,
} from './u.fixture.writer.ts';
import { Schedule } from '../common.ts';

describe('Fs.Capability.Rooted stage activity', () => {
  it('enumerates every public descendant entrypoint and rejects retained methods after writer claim before I/O', async () => {
    const fixture = await setup();
    try {
      let ioCalls = 0;
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          async lstat(path) {
            ioCalls++;
            return await DEFAULT_IO.lstat(path);
          },
          async open(path, options) {
            ioCalls++;
            return await DEFAULT_IO.open(path, options);
          },
          async mkdir(path, options) {
            ioCalls++;
            await DEFAULT_IO.mkdir(path, options);
          },
          async remove(path, options) {
            ioCalls++;
            await DEFAULT_IO.remove(path, options);
          },
        }),
      );
      const stage = await rooted.Stage.create();
      const target = await directoryTarget(stage.files, 'dir');
      const file = (await stage.files.Target.admit([{ kind: 'file', path: 'file' }])).targets[0];
      const foreign = await rooted.Stage.create();
      const { admit } = stage.files.Target;
      const { acquire } = stage.files.Lease;
      const { inspectSeal, seal, remove, removeBatch } = stage.files.Tree;
      const { publish } = stage.files.File;
      const { create, discard, promote } = stage.files.Stage;
      const calls: Record<string, () => Promise<unknown>> = {
        'Target.admit': () => admit([]),
        'Lease.acquire': () => acquire([target], { mode: 'shared' }),
        'Tree.inspectSeal': () => inspectSeal(target),
        'Tree.seal': () => seal(target),
        'Tree.remove': () => remove(target, { lease: {} as t.FsRooted.Lease }),
        'Tree.removeBatch': () => removeBatch([]),
        'File.publish': () => publish(file, new Uint8Array([1])),
        'Stage.create': () => create(),
        'Stage.discard': () => discard(foreign),
        'Stage.promote': () => promote(foreign, target),
      };
      const publicMethods = Object.entries(stage.files).flatMap(([name, surface]) => {
        return name === 'path' ? [] : Object.keys(surface).map((method) => `${name}.${method}`);
      });
      expect(Object.keys(calls)).to.eql(publicMethods);
      await stage.writer.writeTree([], OPTIONS);
      ioCalls = 0;
      for (const call of Object.values(calls)) await expectFailure(call, 'invalid-state');
      await expectFailure(() => rooted.Tree.inspectSeal(stage), 'invalid-state');
      await expectFailure(() => rooted.Tree.seal(stage), 'invalid-state');
      expect(ioCalls).to.eql(0);
      await rooted.Stage.discard(stage);
      await rooted.Stage.discard(foreign);
    } finally {
      await teardown(fixture);
    }
  });

  it('keeps an admitted descriptor borrow until closure and rejects writer claim and promotion without waiting', async () => {
    const fixture = await setup();
    const entered = Promise.withResolvers<void>();
    const resume = Promise.withResolvers<void>();
    try {
      let privateRoot = '';
      let held = false;
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          async open(path, options) {
            const file = await DEFAULT_IO.open(path, options);
            if (!privateRoot || !path.startsWith(privateRoot)) return file;
            return wrapFile(file, {
              async write(bytes) {
                if (!held) {
                  held = true;
                  entered.resolve();
                  await resume.promise;
                }
                return await file.write(bytes);
              },
            });
          },
        }),
      );
      const stage = await rooted.Stage.create();
      privateRoot = stage.path;
      const target = await directoryTarget(rooted, 'published');
      const file = (await stage.files.Target.admit([{ kind: 'file', path: 'file' }])).targets[0];
      const writing = stage.files.File.publish(file, new Uint8Array([1]));
      await entered.promise;
      await stage.files.Target.admit([]); // Ordinary shared borrows still coexist.
      await expectWriteFailure(stage, [], OPTIONS, 'invalid-state');
      await expectFailure(() => rooted.Stage.promote(stage, target), 'invalid-state');
      const discarded = rooted.Stage.discard(stage);
      await expectFailure(() => stage.files.Target.admit([]), 'invalid-state');
      expect(await Fs.exists(stage.path)).to.eql(true);
      resume.resolve();
      await writing;
      await discarded;
      expect(await Fs.exists(stage.path)).to.eql(false);
      expect(await Fs.exists(Fs.join(rooted.path, target.path))).to.eql(false);
    } finally {
      resume.resolve();
      await teardown(fixture);
    }
  });

  it('inherits the full ancestor fence into nested writers and retained grandchild methods', async () => {
    const fixture = await setup();
    const entered = Promise.withResolvers<void>();
    const late = Promise.withResolvers<unknown>();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const parent = await rooted.Stage.create();
      const child = await parent.files.Stage.create();
      const grandchild = await child.files.Stage.create();
      const retained = grandchild.files.Target.admit;
      const childTarget = await directoryTarget(parent.files, 'nested');
      const target = await directoryTarget(rooted, 'result');
      const content = {
        [Symbol.asyncIterator]: () => ({
          next() {
            entered.resolve();
            return late.promise;
          },
          return: () => ({ done: true }),
        }),
      };
      const writing = expectWriteFailure(
        grandchild,
        [treeFile(content)],
        OPTIONS,
        'cancelled',
        true,
      );
      await entered.promise;
      await expectFailure(() => parent.files.Stage.promote(child, childTarget), 'invalid-state');
      await expectFailure(() => rooted.Stage.promote(parent, target), 'invalid-state');
      const discarded = rooted.Stage.discard(parent);
      await expectFailure(() => retained([]), 'invalid-state');
      await writing;
      await discarded;
      late.resolve({ done: false, value: new Uint8Array([1]) });
      await Schedule.tick();
      expect(await Fs.exists(parent.path)).to.eql(false);
      await expectFailure(() => retained([]), 'invalid-state');
    } finally {
      late.resolve(undefined);
      await teardown(fixture);
    }
  });

  it('borrows creating-instance inspection without consuming the pristine writer claim', async () => {
    const fixture = await setup();
    const entered = Promise.withResolvers<void>();
    const resume = Promise.withResolvers<void>();
    try {
      let marker = '';
      let held = false;
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          async open(path, options) {
            const file = await DEFAULT_IO.open(path, options);
            if (path === marker && !held) {
              held = true;
              entered.resolve();
              await resume.promise;
            }
            return file;
          },
        }),
      );
      const stage = await rooted.Stage.create();
      marker = Fs.join(Fs.dirname(stage.path), 'owner');
      const inspecting = rooted.Tree.inspectSeal(stage);
      await entered.promise;
      await expectWriteFailure(stage, [], OPTIONS, 'invalid-state');
      resume.resolve();
      expect(await inspecting).to.eql({ kind: 'unsealed' });
      await stage.writer.writeTree([], OPTIONS);
      await rooted.Stage.discard(stage);
    } finally {
      resume.resolve();
      await teardown(fixture);
    }
  });

  it('keeps creating-instance sealing and asynchronous mode closure inside one borrow', async () => {
    const fixture = await setup();
    const entered = Promise.withResolvers<void>();
    const resume = Promise.withResolvers<void>();
    try {
      let privateRoot = '';
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          async openMode(path) {
            const file = await DEFAULT_IO.openMode(path);
            return {
              stat: () => file.stat(),
              chmod: (mode) => file.chmod(mode),
              async close() {
                if (path === privateRoot) {
                  entered.resolve();
                  await resume.promise;
                }
                await file.close();
              },
            };
          },
        }),
      );
      const stage = await rooted.Stage.create();
      privateRoot = stage.path;
      const target = await directoryTarget(rooted, 'result');
      const sealing = expectFailure(() => rooted.Tree.seal(stage), 'invalid-state', true);
      await entered.promise;
      await expectWriteFailure(stage, [], OPTIONS, 'invalid-state');
      await expectFailure(() => rooted.Stage.promote(stage, target), 'invalid-state');
      const discard = rooted.Stage.discard(stage);
      expect(await Fs.exists(stage.path)).to.eql(true);
      resume.resolve();
      await sealing;
      await discard;
    } finally {
      resume.resolve();
      await teardown(fixture);
    }
  });

  it('rejects ancestor sealing before I/O while a nested writer owns pending producer demand', async () => {
    const fixture = await setup();
    const entered = Promise.withResolvers<void>();
    const late = Promise.withResolvers<unknown>();
    const controller = new AbortController();
    try {
      let reads = 0;
      let modes = 0;
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          async lstat(path) {
            reads++;
            return await DEFAULT_IO.lstat(path);
          },
          async openMode(path) {
            modes++;
            return await DEFAULT_IO.openMode(path);
          },
        }),
      );
      const parent = await rooted.Stage.create();
      const child = await parent.files.Stage.create();
      const content = {
        [Symbol.asyncIterator]: () => ({
          next() {
            entered.resolve();
            return late.promise;
          },
          return: () => ({ done: true }),
        }),
      };
      const writing = expectWriteFailure(
        child,
        [treeFile(content)],
        { ...OPTIONS, until: controller.signal },
        'cancelled',
        true,
      );
      try {
        await entered.promise;
        reads = 0;
        await expectFailure(() => rooted.Tree.seal(parent), 'invalid-state');
        expect(reads).to.eql(0);
        expect(modes).to.eql(0);
      } finally {
        controller.abort();
        await writing;
        await rooted.Stage.discard(parent);
      }
      expect(await Fs.exists(parent.path)).to.eql(false);
    } finally {
      late.resolve(undefined);
      await teardown(fixture);
    }
  });

  it('excludes nested writer admission until ancestor sealing proves asynchronous mode closure', async () => {
    const fixture = await setup();
    const entered = Promise.withResolvers<void>();
    const resume = Promise.withResolvers<void>();
    try {
      let heldPath = '';
      let reads = 0;
      let producers = 0;
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          async lstat(path) {
            reads++;
            return await DEFAULT_IO.lstat(path);
          },
          async openMode(path) {
            const file = await DEFAULT_IO.openMode(path);
            return {
              stat: () => file.stat(),
              chmod: (mode) => file.chmod(mode),
              async close() {
                if (path === heldPath) {
                  entered.resolve();
                  await resume.promise;
                }
                await file.close();
              },
            };
          },
        }),
      );
      const parent = await rooted.Stage.create();
      const child = await parent.files.Stage.create();
      heldPath = child.path;
      const content = Object.defineProperty({}, Symbol.asyncIterator, {
        get() {
          producers++;
          throw new Error('Producer must not be looked up during sealing');
        },
      });
      const sealing = rooted.Tree.seal(parent);
      try {
        await entered.promise;
        reads = 0;
        await expectWriteFailure(child, [treeFile(content)], OPTIONS, 'invalid-state');
        await expectFailure(() => child.files.Target.admit([]), 'invalid-state');
        expect(reads).to.eql(0);
        expect(producers).to.eql(0);
        resume.resolve();
        expect(await sealing).to.eql({ kind: 'applied', changed: true });
        // Sealing is a temporary exclusion, not a writer claim or permanent revocation.
        await child.writer.writeTree([], OPTIONS);
      } finally {
        resume.resolve();
        await sealing;
        await rooted.Stage.discard(parent);
      }
      expect(await Fs.exists(parent.path)).to.eql(false);
    } finally {
      resume.resolve();
      await teardown(fixture);
    }
  });

  it('promotion owns its transition during internal validation and defeats competing discard or promotion', async () => {
    const fixture = await setup();
    const entered = Promise.withResolvers<void>();
    const resume = Promise.withResolvers<void>();
    try {
      let renames = 0;
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          async rename(from, to) {
            renames++;
            entered.resolve();
            await resume.promise;
            await DEFAULT_IO.rename(from, to);
          },
        }),
      );
      const stage = await rooted.Stage.create();
      const target = await directoryTarget(rooted, 'result');
      await stage.writer.writeTree([treeFile()], OPTIONS);
      const publishing = rooted.Stage.promote(stage, target, { seal: true });
      await entered.promise;
      await expectFailure(() => rooted.Stage.discard(stage), 'invalid-state');
      await expectFailure(() => rooted.Stage.promote(stage, target), 'invalid-state');
      await expectFailure(() => stage.files.Target.admit([]), 'invalid-state');
      resume.resolve();
      const result = await publishing;
      expect(result.kind).to.eql('published');
      expect(result.cleanupError).to.eql(undefined);
      expect(renames).to.eql(1);
      await rooted.Stage.discard(stage);
    } finally {
      resume.resolve();
      await teardown(fixture);
    }
  });

  it('composite batch removal reuses its admitted borrow while discard waits for its lease release', async () => {
    const fixture = await setup();
    const entered = Promise.withResolvers<void>();
    const resume = Promise.withResolvers<void>();
    try {
      let target = '';
      let held = false;
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          async lstat(path) {
            if (path === target && !held) {
              held = true;
              entered.resolve();
              await resume.promise;
            }
            return await DEFAULT_IO.lstat(path);
          },
        }),
      );
      const stage = await rooted.Stage.create();
      await Deno.mkdir(Fs.join(stage.path, 'tree'));
      target = Fs.join(stage.path, 'tree');
      const removing = stage.files.Tree.removeBatch(['tree']);
      await entered.promise;
      const discard = rooted.Stage.discard(stage);
      resume.resolve();
      const result = await removing;
      expect(result).to.eql({
        kind: 'settled',
        results: [{ index: 0, path: 'tree', kind: 'removed' }],
      });
      await discard;
    } finally {
      resume.resolve();
      await teardown(fixture);
    }
  });

  it('does not borrow for idle child leases and keeps release cleanup callable after revocation', async () => {
    const fixture = await setup();
    try {
      let closed = 0;
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          async open(path, options) {
            const file = await DEFAULT_IO.open(path, options);
            return wrapFile(file, {
              close() {
                if (path.endsWith('.lock')) closed++;
                file.close();
              },
            });
          },
        }),
      );
      const stage = await rooted.Stage.create();
      const target = await directoryTarget(stage.files, 'tree');
      const acquired = await stage.files.Lease.acquire([target], { mode: 'exclusive' });
      if (acquired.kind !== 'acquired') throw new Error('Expected lease');
      await rooted.Stage.discard(stage);
      await expectFailure(() => acquired.lease.release(), 'unsafe-filesystem');
      expect(closed).to.eql(1);
    } finally {
      await teardown(fixture);
    }
  });
});
