import {
  createRooted,
  DEFAULT_IO,
  describe,
  expect,
  expectFailure,
  Fs,
  it,
  setup,
  teardown,
  withIo,
  wrapFile,
  wrapModeHandle,
} from './u.fixture.ts';
import { writeStageManifest as fill } from './u.fixture.stage.ts';
import { directoryTarget } from './u.fixture.target.ts';
import { cleanupFailure, failure } from '../u/u.error.ts';

describe('Fs.Capability.Rooted failure settlement', () => {
  it('cleanup evidence → retains the first failure and cannot downgrade committed state', () => {
    const cause = new Error('primary');
    const primary = failure('promote-stage', 'unsupported', { cause });
    const first = failure('promote-stage', 'ownership-lost');
    const later = failure('promote-stage', 'io-failure', { committed: true });
    const combined = cleanupFailure('promote-stage', primary, first);
    const settled = cleanupFailure('promote-stage', combined, later);
    expect(settled.kind).to.eql('unsupported');
    expect(settled.cause).to.equal(cause);
    expect(settled.cleanupError).to.equal(first);
    expect(settled.committed).to.eql(true);
    expect(cleanupFailure('promote-stage', settled, first).committed).to.eql(true);
  });

  it('partial promotion cleanup → observation failure retains known removal and the rename cause', async () => {
    const fixture = await setup();
    try {
      const primary = new Deno.errors.NotSupported('rename before effect');
      const cleanup = new Error('observation after removal');
      let content = '';
      let removed = false;
      const io = withIo({
        rename: () => Promise.reject(primary),
        async remove(path, options) {
          await DEFAULT_IO.remove(path, options);
          if (path === Fs.join(content, 'dist.json')) removed = true;
        },
        async lstat(path) {
          if (removed && path === content) throw cleanup;
          return await DEFAULT_IO.lstat(path);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'out');
      const stage = await rooted.Stage.create();
      content = stage.path;
      await fill(stage, 'private');
      const error = await expectFailure(
        () => rooted.Stage.promote(stage, target),
        'unsupported',
        true,
      );
      expect(error.cause).to.equal(primary);
      expect(error.cleanupError?.kind).to.eql('io-failure');
      expect(error.cleanupError?.committed).to.eql(true);
      expect(error.cleanupError?.cause).to.have.property('cause', cleanup);
      expect(removed).to.eql(true);
      expect(await Fs.exists(Fs.join(content, 'dist.json'))).to.eql(false);
      expect(await Fs.exists(Fs.join(rooted.path, 'out'))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  for (const operation of ['inspect-seal', 'seal-tree', 'promote-stage'] as const) {
    it(`nested ${operation} marker failure → retains unsupported and close evidence`, async () => {
      const fixture = await setup();
      try {
        const primary = new Deno.errors.NotSupported('nested marker read');
        const cleanup = new Error('nested marker close after effect');
        let armed = false;
        let reads = 0;
        let closed = 0;
        let removals = 0;
        const io = withIo({
          async open(path, options) {
            const file = await DEFAULT_IO.open(path, options);
            if (!armed || Fs.basename(path) !== 'owner') return file;
            reads++;
            if (reads !== 2) return file;
            return wrapFile(file, {
              read: () => Promise.reject(primary),
              close() {
                file.close();
                closed++;
                throw cleanup;
              },
            });
          },
          async remove(path, options) {
            removals++;
            await DEFAULT_IO.remove(path, options);
          },
        });
        const rooted = await createRooted({ root: fixture.root }, io);
        const target = await directoryTarget(rooted, 'out');
        const stage = await rooted.Stage.create();
        await fill(stage, 'private');
        removals = 0;
        armed = true;
        const error = await expectFailure(() => {
          if (operation === 'inspect-seal') return rooted.Tree.inspectSeal(stage);
          if (operation === 'seal-tree') return rooted.Tree.seal(stage);
          return rooted.Stage.promote(stage, target, { seal: true });
        }, 'unsupported');
        expect(error.operation).to.eql(operation);
        expect(error.cause).to.equal(primary);
        expect(error.cleanupError?.cause).to.equal(cleanup);
        expect(error.cleanupError?.kind).to.eql('io-failure');
        await expectFailure(() => rooted.Stage.discard(stage), 'ownership-lost');
        expect(reads).to.eql(2);
        expect(closed).to.eql(1);
        expect(removals).to.eql(0);
        expect(await Deno.readTextFile(Fs.join(stage.path, 'dist.json'))).to.eql('private');
        expect(await Fs.exists(Fs.join(rooted.path, 'out'))).to.eql(false);
      } finally {
        await teardown(fixture);
      }
    });
  }

  for (const operation of ['inspect-seal', 'seal-tree'] as const) {
    it(`${operation} unsupported without cleanup failure → retains the ordinary result`, async () => {
      const fixture = await setup();
      try {
        let armed = false;
        let reads = 0;
        const io = withIo({
          async open(path, options) {
            const file = await DEFAULT_IO.open(path, options);
            if (!armed || Fs.basename(path) !== 'owner') return file;
            reads++;
            if (reads !== 2) return file;
            return wrapFile(file, {
              read: () => Promise.reject(new Deno.errors.NotSupported('marker read')),
            });
          },
        });
        const rooted = await createRooted({ root: fixture.root }, io);
        const stage = await rooted.Stage.create();
        await fill(stage, 'private');
        armed = true;
        const result = operation === 'inspect-seal'
          ? await rooted.Tree.inspectSeal(stage)
          : await rooted.Tree.seal(stage);
        expect(result).to.eql({ kind: 'unsupported' });
        expect(Object.isFrozen(result)).to.eql(true);
        await rooted.Stage.discard(stage);
        expect(await Fs.exists(stage.path)).to.eql(false);
      } finally {
        await teardown(fixture);
      }
    });
  }

  for (const kind of ['io-failure', 'unsupported'] as const) {
    for (const afterEffect of [false, true]) {
      it(`chmod ${kind} ${afterEffect ? 'after' : 'before'} effect and close failure → preserves both causes`, async () => {
        const fixture = await setup();
        try {
          const primary = kind === 'unsupported'
            ? new Deno.errors.NotSupported('chmod')
            : new Error('chmod');
          const cleanup = new Error('mode close after effect');
          let closed = 0;
          let removals = 0;
          const io = withIo({
            async openMode(path) {
              const file = await DEFAULT_IO.openMode(path);
              if (Fs.basename(path) !== 'dist.json') return file;
              return wrapModeHandle(file, {
                async chmod(mode) {
                  if (afterEffect) await file.chmod(mode);
                  throw primary;
                },
                async close() {
                  await file.close();
                  closed++;
                  throw cleanup;
                },
              });
            },
            async remove(path, options) {
              removals++;
              await DEFAULT_IO.remove(path, options);
            },
          });
          const rooted = await createRooted({ root: fixture.root }, io);
          const target = await directoryTarget(rooted, 'out');
          const stage = await rooted.Stage.create();
          await fill(stage, 'private');
          const path = Fs.join(stage.path, 'dist.json');
          const before = await Deno.stat(path);
          removals = 0;
          const error = await expectFailure(
            () => rooted.Stage.promote(stage, target, { seal: true }),
            kind,
            afterEffect,
          );
          expect(error.cause).to.equal(primary);
          expect(error.cleanupError?.cause).to.equal(cleanup);
          expect(error.cleanupError?.kind).to.eql('io-failure');
          await expectFailure(() => rooted.Stage.discard(stage), 'ownership-lost');
          expect(closed).to.eql(1);
          expect(removals).to.eql(0);
          const after = await Deno.stat(path);
          expect(after.mode === before.mode).to.eql(!afterEffect);
          expect(await Deno.readTextFile(path)).to.eql('private');
          expect(await Fs.exists(Fs.join(rooted.path, 'out'))).to.eql(false);
        } finally {
          await teardown(fixture);
        }
      });
    }
  }

  it('post-seal validation → commitment upgrade retains the nested marker cleanup failure', async () => {
    const fixture = await setup();
    try {
      const primary = new Deno.errors.NotSupported('post-seal marker read');
      const cleanup = new Error('post-seal marker close after effect');
      let content = '';
      let sealed = false;
      let removals = 0;
      const io = withIo({
        async openMode(path) {
          const file = await DEFAULT_IO.openMode(path);
          return wrapModeHandle(file, {
            async chmod(mode) {
              await file.chmod(mode);
              if (path === content) sealed = true;
            },
          });
        },
        async open(path, options) {
          const file = await DEFAULT_IO.open(path, options);
          if (!sealed || Fs.basename(path) !== 'owner') return file;
          return wrapFile(file, {
            read: () => Promise.reject(primary),
            close() {
              file.close();
              throw cleanup;
            },
          });
        },
        async remove(path, options) {
          if (sealed) removals++;
          await DEFAULT_IO.remove(path, options);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'out');
      const stage = await rooted.Stage.create();
      content = stage.path;
      await fill(stage, 'private');
      const error = await expectFailure(
        () => rooted.Stage.promote(stage, target, { seal: true }),
        'unsupported',
        true,
      );
      expect(error.cause).to.have.property('cause', primary);
      expect(error.cleanupError?.cause).to.equal(cleanup);
      await expectFailure(() => rooted.Stage.discard(stage), 'ownership-lost');
      expect(sealed).to.eql(true);
      expect(removals).to.eql(0);
      expect(await Fs.exists(Fs.join(rooted.path, 'out'))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('post-seal child observation → retains mutation evidence through snapshot traversal', async () => {
    const fixture = await setup();
    try {
      const primary = new Error('post-seal child observation');
      let content = '';
      let sealed = false;
      let observingChildren = false;
      const io = withIo({
        async openMode(path) {
          const file = await DEFAULT_IO.openMode(path);
          return wrapModeHandle(file, {
            async chmod(mode) {
              await file.chmod(mode);
              if (path === content) sealed = true;
            },
          });
        },
        async *readDir(path) {
          if (sealed && path === content) observingChildren = true;
          yield* DEFAULT_IO.readDir(path);
        },
        async lstat(path) {
          if (observingChildren && path === Fs.join(content, 'dist.json')) throw primary;
          return await DEFAULT_IO.lstat(path);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'out');
      const stage = await rooted.Stage.create();
      content = stage.path;
      await fill(stage, 'private');
      const error = await expectFailure(
        () => rooted.Stage.promote(stage, target, { seal: true }),
        'io-failure',
        true,
      );
      expect(error.cause).to.have.property('cause', primary);
      expect(observingChildren).to.eql(true);
      expect(await Deno.readTextFile(Fs.join(content, 'dist.json'))).to.eql('private');
      expect(await Fs.exists(Fs.join(rooted.path, 'out'))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('presealed stage made movable → late observation retains the private mode change', async () => {
    const fixture = await setup();
    try {
      const primary = new Error('movable root observation');
      let content = '';
      let armed = false;
      let movable = false;
      let markerValidated = false;
      const io = withIo({
        async openMode(path) {
          const file = await DEFAULT_IO.openMode(path);
          return wrapModeHandle(file, {
            async chmod(mode) {
              await file.chmod(mode);
              if (armed && path === content) movable = true;
            },
          });
        },
        async open(path, options) {
          const file = await DEFAULT_IO.open(path, options);
          if (!movable || Fs.basename(path) !== 'owner') return file;
          return wrapFile(file, {
            close() {
              file.close();
              markerValidated = true;
            },
          });
        },
        async lstat(path) {
          if (markerValidated && path === content) throw primary;
          return await DEFAULT_IO.lstat(path);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'out');
      const stage = await rooted.Stage.create();
      content = stage.path;
      await fill(stage, 'private');
      expect((await rooted.Tree.seal(stage)).kind).to.eql('applied');
      armed = true;
      const error = await expectFailure(
        () => rooted.Stage.promote(stage, target),
        'io-failure',
        true,
      );
      expect(error.cause).to.have.property('cause', primary);
      expect(movable).to.eql(true);
      expect(((await Deno.stat(content)).mode ?? 0) & 0o200).to.eql(0o200);
      expect(await Fs.exists(Fs.join(rooted.path, 'out'))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  for (const boundary of ['stat', 'write', 'sync'] as const) {
    it(`marker ${boundary} and close fail → creation retains primary and first cleanup evidence`, async () => {
      const fixture = await setup();
      try {
        const primary = new Deno.errors.NotSupported(`marker ${boundary}`);
        const cleanup = new Error('marker close after effect');
        let marker = '';
        let closed = 0;
        let removals = 0;
        const io = withIo({
          async open(path, options) {
            const file = await DEFAULT_IO.open(path, options);
            if (Fs.basename(path) !== 'owner') return file;
            marker = path;
            return wrapFile(file, {
              async stat() {
                if (boundary === 'stat') throw primary;
                return await file.stat();
              },
              async write(bytes) {
                if (boundary === 'write') throw primary;
                return await file.write(bytes);
              },
              async sync() {
                if (boundary === 'sync') throw primary;
                await file.sync();
              },
              close() {
                file.close();
                closed++;
                throw cleanup;
              },
            });
          },
          async remove(path, options) {
            removals++;
            await DEFAULT_IO.remove(path, options);
          },
        });
        const rooted = await createRooted({ root: fixture.root }, io);
        const error = await expectFailure(() => rooted.Stage.create(), 'unsupported');
        expect(error.operation).to.eql('create-stage');
        expect(error.cause).to.equal(primary);
        expect(error.cleanupError?.kind).to.eql('io-failure');
        expect(error.cleanupError?.operation).to.eql('create-stage');
        expect(error.cleanupError?.cause).to.equal(cleanup);
        expect(closed).to.eql(1);
        expect(removals).to.eql(0);
        expect(await Fs.exists(marker)).to.eql(true);
      } finally {
        await teardown(fixture);
      }
    });
  }

  for (const boundary of ['discard', 'promote'] as const) {
    it(`marker read and close fail → ${boundary} preserves evidence and refuses cleanup retries`, async () => {
      const fixture = await setup();
      try {
        const primary = new Deno.errors.NotSupported('marker read');
        const cleanup = new Error('marker close after effect');
        let armed = false;
        let closed = 0;
        let removals = 0;
        let unlocks = 0;
        const io = withIo({
          async open(path, options) {
            const file = await DEFAULT_IO.open(path, options);
            if (!armed) return file;
            if (path.endsWith('.lock')) {
              return wrapFile(file, {
                async unlock() {
                  await file.unlock();
                  unlocks++;
                  throw new Error('later lock release failure');
                },
              });
            }
            if (Fs.basename(path) !== 'owner') return file;
            return wrapFile(file, {
              read: () => Promise.reject(primary),
              close() {
                file.close();
                closed++;
                throw cleanup;
              },
            });
          },
          async remove(path, options) {
            removals++;
            await DEFAULT_IO.remove(path, options);
          },
        });
        const rooted = await createRooted({ root: fixture.root }, io);
        const target = await directoryTarget(rooted, 'out');
        const stage = await rooted.Stage.create();
        await fill(stage, 'private');
        removals = 0;
        armed = true;
        const error = await expectFailure(
          () => {
            return boundary === 'discard'
              ? rooted.Stage.discard(stage)
              : rooted.Stage.promote(stage, target);
          },
          'unsupported',
        );
        expect(error.operation).to.eql(`${boundary}-stage`);
        expect(error.cause).to.equal(primary);
        expect(error.cleanupError?.kind).to.eql('io-failure');
        expect(error.cleanupError?.operation).to.eql(`${boundary}-stage`);
        expect(error.cleanupError?.cause).to.equal(cleanup);
        expect(unlocks).to.eql(boundary === 'promote' ? 1 : 0);
        armed = false;
        await expectFailure(() => rooted.Stage.discard(stage), 'ownership-lost');
        await expectFailure(() => stage.files.Stage.create(), 'invalid-state');
        expect(closed).to.eql(1);
        expect(removals).to.eql(0);
        expect(await Deno.readTextFile(Fs.join(stage.path, 'dist.json'))).to.eql('private');
        expect(await Fs.exists(Fs.join(Fs.dirname(stage.path), 'owner'))).to.eql(true);
        expect(await Fs.exists(Fs.join(fixture.root, 'out'))).to.eql(false);
      } finally {
        await teardown(fixture);
      }
    });
  }

  it('published marker mismatch and close failure → retains publication and both failure classifications', async () => {
    const fixture = await setup();
    try {
      let published = false;
      let closed = 0;
      let removals = 0;
      const cleanup = new Deno.errors.NotSupported('marker close after effect');
      const io = withIo({
        async rename(from, to) {
          await DEFAULT_IO.rename(from, to);
          published = true;
        },
        async open(path, options) {
          const file = await DEFAULT_IO.open(path, options);
          if (!published || Fs.basename(path) !== 'owner') return file;
          return wrapFile(file, {
            async read(bytes) {
              const count = await file.read(bytes);
              if (count !== null && count > 0) bytes[0] ^= 1;
              return count;
            },
            close() {
              file.close();
              closed++;
              throw cleanup;
            },
          });
        },
        async remove(path, options) {
          if (published) removals++;
          await DEFAULT_IO.remove(path, options);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'out');
      const stage = await rooted.Stage.create();
      await fill(stage, 'complete');
      const result = await rooted.Stage.promote(stage, target);
      expect(result.kind).to.eql('published');
      expect(result.cleanupError?.operation).to.eql('promote-stage');
      expect(result.cleanupError?.kind).to.eql('ownership-lost');
      expect(result.cleanupError?.committed).to.eql(true);
      expect(result.cleanupError?.cleanupError?.kind).to.eql('unsupported');
      expect(result.cleanupError?.cleanupError?.cause).to.equal(cleanup);
      await expectFailure(() => rooted.Stage.discard(stage), 'ownership-lost', true);
      expect(closed).to.eql(1);
      expect(removals).to.eql(0);
      expect(await Deno.readTextFile(Fs.join(fixture.root, 'out', 'dist.json'))).to.eql('complete');
      expect(await Fs.exists(Fs.join(Fs.dirname(stage.path), 'owner'))).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });

  for (const observation of ['destination', 'source'] as const) {
    it(`rename after effect → failed ${observation} reconciliation retains uncertainty`, async () => {
      const fixture = await setup();
      try {
        const destination = Fs.join(fixture.root, 'out');
        let moved = false;
        let removals = 0;
        const renameFailure = new Error('rename after effect');
        const observationFailure = new Error('reconciliation');
        const io = withIo({
          async open(path, options) {
            const file = await DEFAULT_IO.open(path, options);
            if (observation !== 'source' || !path.endsWith('.lock')) return file;
            return wrapFile(file, {
              async unlock() {
                await file.unlock();
                throw new Error('release after effect');
              },
            });
          },
          async rename(from, to) {
            await DEFAULT_IO.rename(from, to);
            if (to === destination) {
              moved = true;
              throw renameFailure;
            }
          },
          async lstat(path) {
            if (
              moved &&
              (observation === 'destination'
                ? path === destination
                : Fs.basename(path) === 'content')
            ) {
              throw observationFailure;
            }
            return await DEFAULT_IO.lstat(path);
          },
          async remove(path, options) {
            if (moved) removals++;
            await DEFAULT_IO.remove(path, options);
          },
        });
        const rooted = await createRooted({ root: fixture.root }, io);
        const target = await directoryTarget(rooted, 'out');
        const stage = await rooted.Stage.create();
        await fill(stage, 'complete');

        const error = await expectFailure(
          () => rooted.Stage.promote(stage, target),
          'unsafe-filesystem',
          true,
        );
        expect(error.cause).to.be.instanceOf(SuppressedError);
        const causes = error.cause as SuppressedError;
        expect(causes.suppressed).to.equal(renameFailure);
        expect(causes.error.cause).to.equal(observationFailure);
        if (observation === 'source') expect(error.cleanupError?.kind).to.eql('io-failure');
        expect(await Deno.readTextFile(Fs.join(destination, 'dist.json'))).to.eql('complete');
        expect(await Fs.exists(Fs.join(Fs.dirname(stage.path), 'owner'))).to.eql(true);
        expect(removals).to.eql(0);
      } finally {
        await teardown(fixture);
      }
    });
  }

  it('unresolved rename before effect → retains private content rather than guessing non-publication', async () => {
    const fixture = await setup();
    try {
      const destination = Fs.join(fixture.root, 'out');
      let attempted = false;
      const io = withIo({
        async rename(from, to) {
          if (to === destination) {
            attempted = true;
            throw new Error('before effect');
          }
          await DEFAULT_IO.rename(from, to);
        },
        async lstat(path) {
          if (attempted && path === destination) throw new Error('reconciliation');
          return await DEFAULT_IO.lstat(path);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'out');
      const stage = await rooted.Stage.create();
      await fill(stage, 'private');
      await expectFailure(() => rooted.Stage.promote(stage, target), 'unsafe-filesystem', true);
      expect(await Deno.readTextFile(Fs.join(stage.path, 'dist.json'))).to.eql('private');
      expect(await Fs.exists(destination)).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  for (const boundary of ['lock', 'lease'] as const) {
    it(`partial ${boundary} acquisition → preserves primary and cleanup failures and closes the descriptor`, async () => {
      const fixture = await setup();
      try {
        const destination = Fs.join(fixture.root, 'out');
        let held = false;
        let closed = 0;
        const primary = new Deno.errors.NotSupported('acquisition');
        const cleanup = new Error('unlock after effect');
        const io = withIo({
          async open(path, options) {
            const file = await DEFAULT_IO.open(path, options);
            if (!path.endsWith('.lock')) return file;
            return wrapFile(file, {
              async tryLock(exclusive) {
                held = await file.tryLock(exclusive);
                return held;
              },
              async unlock() {
                await file.unlock();
                held = false;
                throw cleanup;
              },
              close() {
                file.close();
                closed++;
              },
            });
          },
          async lstat(path) {
            if (held && path === (boundary === 'lock' ? fixture.root : destination)) throw primary;
            return await DEFAULT_IO.lstat(path);
          },
        });
        const rooted = await createRooted({ root: fixture.root }, io);
        const target = await directoryTarget(rooted, 'out');
        const error = await expectFailure(
          () => rooted.Lease.acquire([target], { mode: 'exclusive' }),
          'unsupported',
        );
        expect(error.cause).to.equal(primary);
        expect(error.cleanupError?.kind).to.eql('io-failure');
        expect(error.cleanupError?.cause).to.equal(cleanup);
        expect(held).to.eql(false);
        expect(closed).to.eql(1);
      } finally {
        await teardown(fixture);
      }
    });
  }

  it('promotion refusal and internal discard failure → preserves both classifications', async () => {
    const fixture = await setup();
    try {
      const destination = Fs.join(fixture.root, 'out');
      let refused = false;
      const primary = new Deno.errors.NotSupported('rename');
      const cleanup = new Error('discard');
      const io = withIo({
        async rename(from, to) {
          if (to === destination) {
            refused = true;
            throw primary;
          }
          await DEFAULT_IO.rename(from, to);
        },
        async remove(path, options) {
          if (refused && path.includes('.sys.rooted')) throw cleanup;
          await DEFAULT_IO.remove(path, options);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'out');
      const stage = await rooted.Stage.create();
      await fill(stage, 'private');
      const error = await expectFailure(() => rooted.Stage.promote(stage, target), 'unsupported');
      expect(error.cause).to.equal(primary);
      expect(error.cleanupError?.kind).to.eql('io-failure');
      expect(error.cleanupError?.cause).to.equal(cleanup);
      expect(await Fs.exists(destination)).to.eql(false);
      expect(await Fs.exists(stage.path)).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });
});
