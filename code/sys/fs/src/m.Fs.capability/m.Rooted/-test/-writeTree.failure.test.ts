import {
  chunks,
  createRooted,
  DEFAULT_IO,
  describe,
  directoryTarget,
  expect,
  expectFailure,
  expectWriteFailure,
  type FileHandle,
  Fs,
  it,
  OPTIONS,
  setup,
  teardown,
  Time,
  treeFile,
  withIo,
  wrapFile,
} from './u.fixture.writer.ts';

describe('Fs.Capability.Rooted writer filesystem settlement', () => {
  it('rejects a non-pristine stage after claiming it, including metadata left by a released lease', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const target = await directoryTarget(rooted, 'result');
      for (const metadata of [false, true]) {
        const stage = await rooted.Stage.create();
        if (metadata) {
          const child = await directoryTarget(stage.files, 'dir');
          const result = await stage.files.Lease.acquire([child], { mode: 'exclusive' });
          if (result.kind !== 'acquired') throw new Error('Expected lease');
          await result.lease.release();
        } else {
          await Deno.writeTextFile(Fs.join(stage.path, 'existing'), 'keep');
        }
        await expectWriteFailure(stage, [], OPTIONS, 'invalid-state');
        await expectFailure(() => stage.files.Target.admit([]), 'invalid-state');
        await expectFailure(() => rooted.Stage.promote(stage, target), 'invalid-state');
        await rooted.Stage.discard(stage);
      }
    } finally {
      await teardown(fixture);
    }
  });

  it('preserves primary write/sync faults and refuses removal when synchronous closure is unproved', async () => {
    const fixture = await setup();
    let leaked: FileHandle | undefined;
    try {
      for (const fault of ['write', 'sync', 'close'] as const) {
        let path = '';
        let returns = 0;
        let removals = 0;
        const rooted = await createRooted(
          { root: fixture.root },
          withIo({
            async open(name, options) {
              const file = await DEFAULT_IO.open(name, options);
              if (name !== path) return file;
              return wrapFile(file, {
                async write(bytes) {
                  if (fault === 'write') throw new Error('primary-write');
                  return await file.write(bytes);
                },
                async sync() {
                  if (fault === 'sync') throw new Error('primary-sync');
                  await file.sync();
                },
                close() {
                  if (fault === 'close') {
                    leaked = file;
                    throw new Error('primary-close');
                  }
                  file.close();
                },
              });
            },
            async remove(name, options) {
              removals++;
              await DEFAULT_IO.remove(name, options);
            },
          }),
        );
        const stage = await rooted.Stage.create();
        path = Fs.join(stage.path, 'file');
        let count = 0;
        const content = {
          [Symbol.asyncIterator]: () => ({
            next: () => count++ ? { done: true } : { value: new Uint8Array([1]) },
            return() {
              returns++;
              throw new Error('cleanup-must-not-win');
            },
          }),
        };
        const error = await expectWriteFailure(
          stage,
          [treeFile(content, 1)],
          OPTIONS,
          'io-failure',
          true,
        );
        expect((error.cause as Error).message).to.eql(`primary-${fault}`);
        expect(returns).to.eql(1);
        if (fault === 'close') {
          await expectFailure(() => rooted.Stage.discard(stage), 'ownership-lost');
          await expectFailure(() => rooted.Stage.discard(stage), 'ownership-lost');
          expect(removals).to.eql(0);
          leaked!.close();
          leaked = undefined;
        } else {
          await rooted.Stage.discard(stage);
          expect(removals > 0).to.eql(true);
        }
      }
    } finally {
      leaked?.close();
      await teardown(fixture);
    }
  });

  it('does not settle timeout or discard ahead of a pending host open and its independently owned handle', async () => {
    const fixture = await setup();
    const entered = Promise.withResolvers<void>();
    const resume = Promise.withResolvers<void>();
    try {
      let path = '';
      let closed = false;
      let writes = 0;
      let removals = 0;
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          async open(name, options) {
            const file = await DEFAULT_IO.open(name, options);
            if (name !== path) return file;
            entered.resolve();
            await resume.promise;
            return wrapFile(file, {
              close() {
                file.close();
                closed = true;
              },
              async write(bytes) {
                writes++;
                return await file.write(bytes);
              },
            });
          },
          async remove(name, options) {
            expect(closed).to.eql(true);
            removals++;
            await DEFAULT_IO.remove(name, options);
          },
        }),
      );
      const stage = await rooted.Stage.create();
      path = Fs.join(stage.path, 'file');
      let settled = false;
      const pending = (async () => {
        await expectWriteFailure(stage, [treeFile()], { ...OPTIONS, timeout: 80 }, 'timeout', true);
        settled = true;
      })();
      await entered.promise;
      await Time.wait(120);
      const discard = rooted.Stage.discard(stage);
      expect(settled).to.eql(false);
      expect(removals).to.eql(0);
      resume.resolve();
      await pending;
      await discard;
      expect(closed).to.eql(true);
      expect(writes).to.eql(0);
      expect(removals > 0).to.eql(true);
    } finally {
      resume.resolve();
      await teardown(fixture);
    }
  });

  it('reconciles failures reported after private mkdir or create-new mutation', async () => {
    const fixture = await setup();
    try {
      for (const kind of ['directory', 'file'] as const) {
        let target = '';
        const rooted = await createRooted(
          { root: fixture.root },
          withIo({
            async mkdir(path, options) {
              await DEFAULT_IO.mkdir(path, options);
              if (path === target) throw new Error('after-mkdir');
            },
            async open(path, options) {
              const file = await DEFAULT_IO.open(path, options);
              if (path === target) {
                file.close();
                throw new Error('after-open');
              }
              return file;
            },
          }),
        );
        const stage = await rooted.Stage.create();
        target = Fs.join(stage.path, 'entry');
        const entries = kind === 'directory'
          ? [{ kind, path: 'entry' }]
          : [treeFile(chunks(), 0, 'entry')];
        await expectWriteFailure(stage, entries, OPTIONS, 'io-failure', true);
        await rooted.Stage.discard(stage);
      }
    } finally {
      await teardown(fixture);
    }
  });

  it('fails on descriptor/path identity drift while discard retains container-owned replacement cleanup', async () => {
    const fixture = await setup();
    try {
      for (const fault of ['descriptor', 'replacement', 'link-count', 'extra'] as const) {
        let path = '';
        let replaced = false;
        let fileClosed = false;
        const outside = Fs.join(fixture.workspace, `saved-${fault}`);
        const rooted = await createRooted(
          { root: fixture.root },
          withIo({
            async open(name, options) {
              const file = await DEFAULT_IO.open(name, options);
              if (name !== path) return file;
              return wrapFile(file, {
                async stat() {
                  const info = await file.stat();
                  if (info.size === 3 && fault === 'descriptor') {
                    return { ...info, ino: info.ino! + 1 };
                  }
                  if (fault === 'link-count') {
                    return { ...info, nlink: 2 };
                  }
                  return info;
                },
                close() {
                  file.close();
                  fileClosed = true;
                },
              });
            },
            async lstat(name) {
              if (name === path && fileClosed && !replaced) {
                replaced = true;
                if (fault === 'replacement') {
                  await Deno.rename(path, outside);
                  await Deno.writeTextFile(path, 'replacement');
                }
                if (fault === 'extra') {
                  await Deno.writeTextFile(Fs.join(Fs.dirname(path), 'unexpected'), 'extra');
                }
              }
              return await DEFAULT_IO.lstat(name);
            },
          }),
        );
        const stage = await rooted.Stage.create();
        path = Fs.join(stage.path, 'file');
        await expectWriteFailure(
          stage,
          [treeFile()],
          OPTIONS,
          fault === 'link-count' ? 'unsafe-filesystem' : 'ownership-lost',
          true,
        );
        await rooted.Stage.discard(stage);
        expect(await Fs.exists(stage.path)).to.eql(false);
        if (fault === 'replacement') {
          expect(await Deno.readFile(outside)).to.eql(new Uint8Array([1, 2, 3]));
        }
      }
    } finally {
      await teardown(fixture);
    }
  });

  it('published cleanup retries refuse unproved marker closure and preserve the complete destination', async () => {
    const fixture = await setup();
    let leaked: FileHandle | undefined;
    try {
      let marker = '';
      let published = false;
      let failed = false;
      let removals = 0;
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          async rename(from, to) {
            await DEFAULT_IO.rename(from, to);
            published = true;
          },
          async open(path, options) {
            const file = await DEFAULT_IO.open(path, options);
            if (!published || path !== marker || failed) return file;
            failed = true;
            return wrapFile(file, {
              close() {
                leaked = file;
                throw new Error('unproved-close');
              },
            });
          },
          async remove(path, options) {
            removals++;
            await DEFAULT_IO.remove(path, options);
          },
        }),
      );
      const target = await directoryTarget(rooted, 'complete');
      const stage = await rooted.Stage.create();
      marker = Fs.join(Fs.dirname(stage.path), 'owner');
      await stage.writer.writeTree([treeFile()], OPTIONS);
      const result = await rooted.Stage.promote(stage, target);
      expect(result.kind).to.eql('published');
      expect(result.cleanupError?.kind).to.eql('io-failure');
      expect(result.cleanupError?.committed).to.eql(true);
      await expectFailure(() => rooted.Stage.discard(stage), 'ownership-lost', true);
      await expectFailure(() => rooted.Stage.discard(stage), 'ownership-lost', true);
      expect(removals).to.eql(0);
      expect(await Deno.readFile(Fs.join(rooted.path, 'complete/file'))).to.eql(
        new Uint8Array([1, 2, 3]),
      );
    } finally {
      leaked?.close();
      await teardown(fixture);
    }
  });

  it('discard revocation never turns failed ownership validation into cleanup authority on retry', async () => {
    const fixture = await setup();
    try {
      let removals = 0;
      const rooted = await createRooted(
        { root: fixture.root },
        withIo({
          async remove(path, options) {
            removals++;
            await DEFAULT_IO.remove(path, options);
          },
        }),
      );
      const stage = await rooted.Stage.create();
      await stage.writer.writeTree([treeFile()], OPTIONS);
      const marker = Fs.join(Fs.dirname(stage.path), 'owner');
      await Deno.writeTextFile(marker, 'foreign');
      await expectFailure(() => rooted.Stage.discard(stage), 'ownership-lost');
      await expectFailure(() => rooted.Stage.discard(stage), 'ownership-lost');
      expect(removals).to.eql(0);
      expect(await Deno.readFile(Fs.join(stage.path, 'file'))).to.eql(new Uint8Array([1, 2, 3]));
    } finally {
      await teardown(fixture);
    }
  });
});
