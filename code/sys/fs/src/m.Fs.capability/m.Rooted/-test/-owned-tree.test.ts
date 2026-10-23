import {
  createRooted,
  DEFAULT_IO,
  describe,
  expect,
  expectFailure,
  expectTypeOf,
  Fs,
  it,
  setup,
  type t,
  teardown,
  Time,
  withIo,
  wrapModeHandle,
} from './u.fixture.ts';
import { writeStageDist as fillStage } from './u.fixture.stage.ts';
import { acquiredLease as acquired, directoryTarget } from './u.fixture.target.ts';
import { readMode as mode, writeDistTree as writeTree } from './u.fixture.tree.ts';

describe('Fs.Capability.Rooted owned trees: sealing evidence and publication', () => {
  it('applies, inspects, and reuses frozen sealing evidence over a complete target', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const path = await writeTree(fixture.root);
      const target = await directoryTarget(rooted, 'generation');

      const before = await rooted.Tree.inspectSeal(target);
      expect(before).to.eql({ kind: 'unsealed' });
      expect(Object.isFrozen(before)).to.eql(true);
      expectTypeOf(before).toEqualTypeOf<t.FsRooted.SealInspection>();

      const applied = await rooted.Tree.seal(target);
      expect(applied).to.eql({ kind: 'applied', changed: true });
      expect(Object.isFrozen(applied)).to.eql(true);
      expectTypeOf(applied).toEqualTypeOf<t.FsRooted.SealResult>();
      expect(await rooted.Tree.inspectSeal(target)).to.eql({ kind: 'sealed' });
      expect((await mode(path)) & 0o222).to.eql(0);
      expect((await mode(Fs.join(path, 'pkg'))) & 0o222).to.eql(0);
      expect((await mode(Fs.join(path, 'dist.json'))) & 0o222).to.eql(0);
      expect(await rooted.Tree.seal(target)).to.eql({ kind: 'applied', changed: false });

      const lease = await acquired(rooted, target, 'exclusive');
      expect(await rooted.Tree.remove(target, { lease })).to.eql({ kind: 'removed' });
      await lease.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('seals a private stage before publication and proves the published target again', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const target = await directoryTarget(rooted, 'generation');
      const stage = await rooted.Stage.create();
      await fillStage(stage);

      expect(await rooted.Tree.inspectSeal(stage)).to.eql({ kind: 'unsealed' });
      const result = await rooted.Stage.promote(stage, target, { seal: true });
      expect(result).to.eql({
        kind: 'published',
        seal: { kind: 'applied', changed: true },
      });
      expect(await rooted.Tree.inspectSeal(target)).to.eql({ kind: 'sealed' });
      expect(await Fs.exists(stage.path)).to.eql(false);

      const lease = await acquired(rooted, target, 'exclusive');
      await rooted.Tree.remove(target, { lease });
      await lease.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('reports cancellation after private sealing as committed before publication', async () => {
    const fixture = await setup();
    try {
      const controller = new AbortController();
      const io = withIo({
        openMode: async (path) => {
          const file = await DEFAULT_IO.openMode(path);
          return wrapModeHandle(file, {
            chmod: async (value) => {
              await file.chmod(value);
              if (Fs.basename(path) === 'content' && (value & 0o200) !== 0) {
                controller.abort('sealed-stage-ready');
              }
            },
          });
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'generation');
      const stage = await rooted.Stage.create();
      await fillStage(stage);

      await expectFailure(
        () => rooted.Stage.promote(stage, target, { seal: true, until: controller.signal }),
        'cancelled',
        true,
      );
      expect(await Fs.exists(stage.path)).to.eql(false);
      expect(await Fs.exists(Fs.join(fixture.root, target.path))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('preserves sealed publication when rename reports failure after moving the stage', async () => {
    const fixture = await setup();
    try {
      const io = withIo({
        rename: async (from, to) => {
          await DEFAULT_IO.rename(from, to);
          throw new Error('rename failed after move');
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'generation');
      const stage = await rooted.Stage.create();
      await fillStage(stage);

      const result = await rooted.Stage.promote(stage, target, { seal: true });
      expect(result.kind).to.eql('published');
      expect(result.kind === 'published' ? result.seal?.kind : undefined).to.eql('applied');
      expect(result.cleanupError?.kind).to.eql('io-failure');
      expect(result.cleanupError?.committed).to.eql(true);
      expect(await rooted.Tree.inspectSeal(target)).to.eql({ kind: 'sealed' });

      const lease = await acquired(rooted, target, 'exclusive');
      await rooted.Tree.remove(target, { lease });
      await lease.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('preserves a presealed private stage through promotion and reseals its root', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const target = await directoryTarget(rooted, 'generation');
      const stage = await rooted.Stage.create();
      await fillStage(stage);
      expect(await rooted.Tree.seal(stage)).to.eql({ kind: 'applied', changed: true });

      const result = await rooted.Stage.promote(stage, target);
      expect(result).to.eql({
        kind: 'published',
        seal: { kind: 'applied', changed: true },
      });
      expect(await rooted.Tree.inspectSeal(target)).to.eql({ kind: 'sealed' });

      const lease = await acquired(rooted, target, 'exclusive');
      await rooted.Tree.remove(target, { lease });
      await lease.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('publishes and removes one generation under the same exclusive lease', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const target = await directoryTarget(rooted, 'generation');
      const lease = await acquired(rooted, target, 'exclusive');
      const stage = await rooted.Stage.create();
      await fillStage(stage);

      expect(await rooted.Stage.promote(stage, target, { seal: true, lease })).to.eql({
        kind: 'published',
        seal: { kind: 'applied', changed: true },
      });
      expect(await rooted.Tree.remove(target, { lease })).to.eql({ kind: 'removed' });
      await lease.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('cleans an already sealed private stage when publication finds an occupied target', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const target = await directoryTarget(rooted, 'generation');
      await Deno.mkdir(Fs.join(fixture.root, target.path));
      const stage = await rooted.Stage.create();
      await fillStage(stage);
      expect(await rooted.Tree.seal(stage)).to.eql({ kind: 'applied', changed: true });

      expect(await rooted.Stage.promote(stage, target, { seal: true })).to.eql({
        kind: 'occupied',
      });
      expect(await Fs.exists(stage.path)).to.eql(false);

      const lease = await acquired(rooted, target, 'exclusive');
      await rooted.Tree.remove(target, { lease });
      await lease.release();
    } finally {
      await teardown(fixture);
    }
  });
});

describe('Fs.Capability.Rooted owned trees: fail-closed traversal and locking', () => {
  it('coordinates target sealing with the same shared and exclusive lock protocol', async () => {
    const fixture = await setup();
    try {
      const controller = new AbortController();
      const io = withIo({
        wait: () => {
          controller.abort('seal-blocked');
          return Promise.reject(new Error('cancelled lock wait'));
        },
      });
      await writeTree(fixture.root);
      const holder = await createRooted({ root: fixture.root }, io);
      const sealer = await createRooted({ root: fixture.root }, io);
      const heldTarget = await directoryTarget(holder, 'generation');
      const sealTarget = await directoryTarget(sealer, 'generation');
      const held = await acquired(holder, heldTarget, 'shared');

      await expectFailure(
        () => sealer.Tree.seal(sealTarget, { until: controller.signal }),
        'cancelled',
      );
      expect((await mode(Fs.join(fixture.root, 'generation', 'dist.json'))) & 0o200).to.eql(
        0o200,
      );

      await held.release();
      expect(await sealer.Tree.seal(sealTarget)).to.eql({ kind: 'applied', changed: true });
      const cleanup = await acquired(sealer, sealTarget, 'exclusive');
      await sealer.Tree.remove(sealTarget, { lease: cleanup });
      await cleanup.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('reuses explicit lease ownership and refuses an implicit self-wait', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      await writeTree(fixture.root);
      const target = await directoryTarget(rooted, 'generation');
      const alias = await directoryTarget(rooted, 'generation');
      const shared = await acquired(rooted, target, 'shared');

      expect(await rooted.Tree.inspectSeal(target, { lease: shared })).to.eql({ kind: 'unsealed' });
      await expectFailure(() => rooted.Tree.inspectSeal(target), 'invalid-lease');
      await expectFailure(() => rooted.Tree.inspectSeal(alias), 'invalid-lease');
      await expectFailure(() => rooted.Tree.inspectSeal(alias, { lease: shared }), 'invalid-lease');
      await expectFailure(() => rooted.Tree.seal(target, { lease: shared }), 'invalid-lease');
      await shared.release();

      const exclusive = await acquired(rooted, target, 'exclusive');
      expect(await rooted.Tree.seal(target, { lease: exclusive })).to.eql({
        kind: 'applied',
        changed: true,
      });
      expect(await rooted.Tree.inspectSeal(target, { lease: exclusive })).to.eql({
        kind: 'sealed',
      });
      await rooted.Tree.remove(target, { lease: exclusive });
      await exclusive.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('returns unsupported without mutation when permission evidence or chmod is unavailable', async () => {
    const fixture = await setup();
    try {
      const noMode = withIo({
        lstat: async (path) => ({ ...await DEFAULT_IO.lstat(path), mode: null }),
      });
      const rooted = await createRooted({ root: fixture.root }, noMode);
      const stage = await rooted.Stage.create();
      await fillStage(stage);
      expect(await rooted.Tree.inspectSeal(stage)).to.eql({ kind: 'unsupported' });
      expect(await rooted.Tree.seal(stage)).to.eql({ kind: 'unsupported' });
      await rooted.Stage.discard(stage);

      const noLinksRoot = Fs.join(fixture.workspace, 'no-links');
      await writeTree(noLinksRoot);
      const noLinks = await createRooted(
        { root: noLinksRoot },
        withIo({
          lstat: async (path) => {
            const info = await DEFAULT_IO.lstat(path);
            return info.isFile ? { ...info, nlink: null } : info;
          },
        }),
      );
      const noLinksTarget = await directoryTarget(noLinks, 'generation');
      expect(await noLinks.Tree.inspectSeal(noLinksTarget)).to.eql({ kind: 'unsupported' });
      expect(await noLinks.Tree.seal(noLinksTarget)).to.eql({ kind: 'unsupported' });

      const unsupported = await createRooted(
        {
          root: Fs.join(fixture.workspace, 'unsupported'),
        },
        withIo({
          openMode: async (path) => {
            const file = await DEFAULT_IO.openMode(path);
            return wrapModeHandle(file, {
              chmod: () => Promise.reject(new Deno.errors.NotSupported('chmod')),
            });
          },
        }),
      );
      const unsupportedStage = await unsupported.Stage.create();
      await fillStage(unsupportedStage);
      expect(await unsupported.Tree.seal(unsupportedStage)).to.eql({ kind: 'unsupported' });
      await unsupported.Stage.discard(unsupportedStage);

      const target = await directoryTarget(unsupported, 'generation');
      const promotionStage = await unsupported.Stage.create();
      await fillStage(promotionStage);
      await expectFailure(
        () => unsupported.Stage.promote(promotionStage, target, { seal: true }),
        'unsupported',
      );
      expect(await Fs.exists(promotionStage.path)).to.eql(false);
      expect(await Fs.exists(Fs.join(unsupported.path, target.path))).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('reports a chmod error as committed when the failing call changed permission state', async () => {
    const fixture = await setup();
    try {
      let failed = false;
      const io = withIo({
        openMode: async (path) => {
          const file = await DEFAULT_IO.openMode(path);
          return wrapModeHandle(file, {
            chmod: async (value) => {
              await file.chmod(value);
              if (!failed) {
                failed = true;
                throw new Deno.errors.NotSupported('changed before failure');
              }
            },
          });
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const stage = await rooted.Stage.create();
      await fillStage(stage);

      await expectFailure(() => rooted.Tree.seal(stage), 'unsupported', true);
      await rooted.Stage.discard(stage);
    } finally {
      await teardown(fixture);
    }
  });

  it('reports unsupported and cancellation as committed after the first permission change', async () => {
    const fixture = await setup();
    try {
      let chmods = 0;
      const unsupportedIo = withIo({
        openMode: async (path) => {
          const file = await DEFAULT_IO.openMode(path);
          return wrapModeHandle(file, {
            chmod: async (value) => {
              chmods += 1;
              if (chmods === 2) throw new Deno.errors.NotSupported('later chmod');
              await file.chmod(value);
            },
          });
        },
      });
      const unsupported = await createRooted({ root: fixture.root }, unsupportedIo);
      const unsupportedStage = await unsupported.Stage.create();
      await fillStage(unsupportedStage);
      await expectFailure(() => unsupported.Tree.seal(unsupportedStage), 'unsupported', true);
      await unsupported.Stage.discard(unsupportedStage);

      const cancelledRoot = Fs.join(fixture.workspace, 'cancelled');
      const controller = new AbortController();
      let changed = false;
      const cancelledIo = withIo({
        openMode: async (path) => {
          const file = await DEFAULT_IO.openMode(path);
          return wrapModeHandle(file, {
            chmod: async (value) => {
              await file.chmod(value);
              if (!changed) {
                changed = true;
                controller.abort('sealed-entry');
              }
            },
          });
        },
      });
      const cancelled = await createRooted({ root: cancelledRoot }, cancelledIo);
      const cancelledStage = await cancelled.Stage.create();
      await fillStage(cancelledStage);
      await expectFailure(
        () => cancelled.Tree.seal(cancelledStage, { until: controller.signal }),
        'cancelled',
        true,
      );
      await cancelled.Stage.discard(cancelledStage);
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects a symlink replacement at the chmod boundary without touching its destination', async () => {
    const fixture = await setup();
    try {
      await Deno.mkdir(fixture.outside);
      const outside = Fs.join(fixture.outside, 'keep.txt');
      await Deno.writeTextFile(outside, 'keep');
      const outsideMode = await mode(outside);
      let replaced = false;
      let moved = '';
      const io = withIo({
        openMode: async (path) => {
          const file = await DEFAULT_IO.openMode(path);
          return wrapModeHandle(file, {
            chmod: async (value) => {
              if (!replaced && path.endsWith('dist.json')) {
                replaced = true;
                moved = `${path}.owned`;
                await Deno.rename(path, moved);
                await Deno.symlink(outside, path);
              }
              await file.chmod(value);
            },
          });
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const stage = await rooted.Stage.create();
      await fillStage(stage);

      await expectFailure(() => rooted.Tree.seal(stage), 'ownership-lost', true);
      expect(await Deno.readTextFile(outside)).to.eql('keep');
      expect(await mode(outside)).to.eql(outsideMode);

      const replacedPath = Fs.join(stage.path, 'dist.json');
      await Deno.remove(replacedPath);
      await Deno.rename(moved, replacedPath);
      await rooted.Stage.discard(stage);
    } finally {
      await teardown(fixture);
    }
  });

  it('refuses a repeated directory identity before traversing a mounted or cyclic alias', async () => {
    const fixture = await setup();
    try {
      const targetPath = await writeTree(fixture.root);
      const nested = Fs.join(targetPath, 'pkg');
      const targetInfo = await Deno.lstat(targetPath);
      const io = withIo({
        lstat: async (path) => {
          const info = await DEFAULT_IO.lstat(path);
          return path === nested ? { ...info, dev: targetInfo.dev, ino: targetInfo.ino } : info;
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'generation');

      await expectFailure(() => rooted.Tree.inspectSeal(target), 'unsafe-filesystem');
      await expectFailure(() => rooted.Tree.seal(target), 'unsafe-filesystem');
    } finally {
      await teardown(fixture);
    }
  });

  it('refuses cross-device descendants before sealing or removal mutates the tree', async () => {
    const fixture = await setup();
    try {
      const targetPath = await writeTree(fixture.root);
      const nested = Fs.join(targetPath, 'pkg');
      const targetInfo = await Deno.lstat(targetPath);
      let chmods = 0;
      let removals = 0;
      const io = withIo({
        lstat: async (path) => {
          const info = await DEFAULT_IO.lstat(path);
          return path === nested ? { ...info, dev: targetInfo.dev + 1 } : info;
        },
        openMode: async (path) => {
          const file = await DEFAULT_IO.openMode(path);
          return wrapModeHandle(file, {
            chmod: async (value) => {
              chmods += 1;
              await file.chmod(value);
            },
          });
        },
        remove: async (path) => {
          removals += 1;
          await DEFAULT_IO.remove(path);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'generation');

      await expectFailure(() => rooted.Tree.inspectSeal(target), 'unsafe-filesystem');
      await expectFailure(() => rooted.Tree.seal(target), 'unsafe-filesystem');
      const lease = await acquired(rooted, target, 'exclusive');
      await expectFailure(() => rooted.Tree.remove(target, { lease }), 'unsafe-filesystem');
      await lease.release();

      expect(chmods).to.eql(0);
      expect(removals).to.eql(0);
      expect(await Deno.readTextFile(Fs.join(nested, 'main.js'))).to.eql(
        'export default 123;',
      );
    } finally {
      await teardown(fixture);
    }
  });

  it('refuses multiply linked files before chmod or removal can affect an external alias', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const targetPath = await writeTree(fixture.root);
      const target = await directoryTarget(rooted, 'generation');
      await Deno.mkdir(fixture.outside);
      const inside = Fs.join(targetPath, 'dist.json');
      const outside = Fs.join(fixture.outside, 'alias.json');
      await Deno.link(inside, outside);
      const outsideMode = await mode(outside);

      await expectFailure(() => rooted.Tree.seal(target), 'unsafe-filesystem');
      expect(await mode(outside)).to.eql(outsideMode);
      const lease = await acquired(rooted, target, 'exclusive');
      await expectFailure(() => rooted.Tree.remove(target, { lease }), 'unsafe-filesystem');
      expect(await Deno.readTextFile(outside)).to.eql('manifest');

      await Deno.remove(outside);
      await rooted.Tree.remove(target, { lease });
      await lease.release();
    } finally {
      await teardown(fixture);
    }
  });
});

describe('Fs.Capability.Rooted owned trees: confined removal', () => {
  it('removes mixed sealed descendants exactly and keeps stable lock identity outside the target', async () => {
    const fixture = await setup();
    try {
      const chmods: string[] = [];
      const io = withIo({
        openMode: async (path) => {
          const file = await DEFAULT_IO.openMode(path);
          return wrapModeHandle(file, {
            chmod: async (value) => {
              chmods.push(path);
              await file.chmod(value);
            },
          });
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const targetPath = await writeTree(fixture.root, 'owners/current');
      const target = await directoryTarget(rooted, 'owners/current');
      const parent = Fs.join(fixture.root, 'owners');
      const sibling = Fs.join(parent, 'sibling');
      await Deno.mkdir(sibling);
      await Deno.writeTextFile(Fs.join(sibling, 'keep.txt'), 'keep');
      await Deno.mkdir(fixture.outside);
      await Deno.writeTextFile(Fs.join(fixture.outside, 'keep.txt'), 'outside');
      const rootMode = await mode(fixture.root);
      const parentMode = await mode(parent);
      const siblingMode = await mode(sibling);

      expect(await rooted.Tree.seal(target)).to.eql({ kind: 'applied', changed: true });
      await Deno.chmod(Fs.join(targetPath, 'pkg', 'main.js'), 0o600);
      chmods.length = 0;

      const lease = await acquired(rooted, target, 'exclusive');
      const removed = await rooted.Tree.remove(target, { lease });
      expect(removed).to.eql({ kind: 'removed' });
      expect(Object.isFrozen(removed)).to.eql(true);
      expectTypeOf(removed).toEqualTypeOf<t.FsRooted.RemoveTreeResult>();
      expect(await rooted.Tree.remove(target, { lease })).to.eql({ kind: 'absent' });
      expect(chmods.every((path) => path.startsWith(`${targetPath}/`) || path === targetPath)).to
        .eql(
          true,
        );
      expect(await mode(fixture.root)).to.eql(rootMode);
      expect(await mode(parent)).to.eql(parentMode);
      expect(await mode(sibling)).to.eql(siblingMode);
      expect(await Deno.readTextFile(Fs.join(sibling, 'keep.txt'))).to.eql('keep');
      expect(await Deno.readTextFile(Fs.join(fixture.outside, 'keep.txt'))).to.eql('outside');
      expect(await Fs.exists(Fs.join(fixture.root, '.sys.rooted', 'locks'))).to.eql(true);
      await lease.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('refuses a sealed parent before weakening or deleting the target', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const targetPath = await writeTree(fixture.root, 'parent/generation');
      const parent = Fs.dirname(targetPath);
      const target = await directoryTarget(rooted, 'parent/generation');
      expect(await rooted.Tree.seal(target)).to.eql({ kind: 'applied', changed: true });
      const lease = await acquired(rooted, target, 'exclusive');

      await Deno.chmod(parent, 0o500);
      try {
        await expectFailure(() => rooted.Tree.remove(target, { lease }), 'permission-denied');
        expect(await rooted.Tree.inspectSeal(target, { lease })).to.eql({ kind: 'sealed' });
        expect(await Deno.readTextFile(Fs.join(targetPath, 'dist.json'))).to.eql('manifest');
      } finally {
        await Deno.chmod(parent, 0o700);
      }

      expect(await rooted.Tree.remove(target, { lease })).to.eql({ kind: 'removed' });
      await lease.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('adds only owner write and traversal permission required inside the removal target', async () => {
    const fixture = await setup();
    try {
      const targetPath = await writeTree(fixture.root);
      const empty = Fs.join(targetPath, 'empty');
      await Deno.mkdir(empty);
      await Deno.chmod(empty, 0o500);
      await Deno.chmod(targetPath, 0o500);
      const restored: Array<readonly [string, number]> = [];
      const io = withIo({
        openMode: async (path) => {
          const file = await DEFAULT_IO.openMode(path);
          return wrapModeHandle(file, {
            chmod: async (value) => {
              restored.push(Object.freeze([path, value]));
              await file.chmod(value);
            },
          });
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'generation');
      const lease = await acquired(rooted, target, 'exclusive');

      await rooted.Tree.remove(target, { lease });
      expect(restored).to.eql([[targetPath, 0o700]]);
      await lease.release();
    } finally {
      await teardown(fixture);
    }
  });
});

describe('Fs.Capability.Rooted owned trees: authority and input', () => {
  it('accepts only owned directory targets or active private stages for sealing', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const files = await rooted.Target.admit([{ kind: 'file', path: 'asset.js' }]);
      await expectFailure(
        () => rooted.Tree.seal(files.targets[0] as unknown as t.FsRooted.OwnedTree),
        'invalid-target',
      );

      const foreign = await Fs.Capability.Rooted.create({ root: fixture.root });
      const foreignTarget = await directoryTarget(foreign, 'generation');
      await expectFailure(() => rooted.Tree.inspectSeal(foreignTarget), 'foreign-handle');

      const missing = await directoryTarget(rooted, 'generation');
      await expectFailure(() => rooted.Tree.inspectSeal(missing), 'missing');
      await expectFailure(() => rooted.Tree.seal(missing), 'missing');

      const stage = await rooted.Stage.create();
      await rooted.Stage.discard(stage);
      await expectFailure(() => rooted.Tree.inspectSeal(stage), 'invalid-state');
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects malformed sealing and promotion options through typed promise failures', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const target = await directoryTarget(rooted, 'generation');
      const stage = await rooted.Stage.create();
      await fillStage(stage);

      await expectFailure(
        () =>
          rooted.Tree.inspectSeal(
            stage,
            null as unknown as t.FsRooted.OperationOptions,
          ),
        'invalid-options',
      );
      const hostile = Object.defineProperty({}, 'until', {
        get(): never {
          throw new Error('SECRET');
        },
      }) as t.FsRooted.OwnedTreeOptions;
      await expectFailure(() => rooted.Tree.seal(stage, hostile), 'invalid-options');

      const shared = await acquired(rooted, target, 'shared');
      await expectFailure(() => rooted.Tree.inspectSeal(stage, { lease: shared }), 'invalid-lease');
      await expectFailure(
        () => rooted.Stage.promote(stage, target, { lease: shared }),
        'invalid-lease',
      );
      expect(await Fs.exists(stage.path)).to.eql(true);
      await shared.release();

      await expectFailure(
        () =>
          rooted.Stage.promote(stage, target, {
            seal: 'yes',
          } as unknown as t.FsRooted.PromotionOptions),
        'invalid-options',
      );
      expect(await Fs.exists(stage.path)).to.eql(true);
      await rooted.Stage.discard(stage);
    } finally {
      await teardown(fixture);
    }
  });

  it('requires the exact active exclusive lease and rejects malformed options asynchronously', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      await writeTree(fixture.root);
      await Deno.mkdir(Fs.join(fixture.root, 'other'));
      const target = await directoryTarget(rooted, 'generation');
      const other = await directoryTarget(rooted, 'other');

      const shared = await acquired(rooted, target, 'shared');
      await expectFailure(() => rooted.Tree.remove(target, { lease: shared }), 'invalid-lease');
      await shared.release();

      const wrong = await acquired(rooted, other, 'exclusive');
      await expectFailure(() => rooted.Tree.remove(target, { lease: wrong }), 'invalid-lease');
      await wrong.release();

      const released = await acquired(rooted, target, 'exclusive');
      await released.release();
      await expectFailure(() => rooted.Tree.remove(target, { lease: released }), 'invalid-lease');

      let synchronous = true;
      const pending = rooted.Tree.remove(
        target,
        null as unknown as t.FsRooted.RemoveTreeOptions,
      );
      synchronous = false;
      expect(synchronous).to.eql(false);
      await expectFailure(() => pending, 'invalid-options');
      await expectFailure(
        () =>
          rooted.Tree.remove(target, {
            lease: released,
            until: 'later',
          } as unknown as t.FsRooted.RemoveTreeOptions),
        'invalid-options',
      );
      await expectFailure(
        () => rooted.Tree.remove(target, {} as t.FsRooted.RemoveTreeOptions),
        'invalid-lease',
      );

      const lease = await acquired(rooted, target, 'exclusive');
      await rooted.Tree.remove(target, { lease });
      await lease.release();
      const otherLease = await acquired(rooted, other, 'exclusive');
      await rooted.Tree.remove(other, { lease: otherLease });
      await otherLease.release();
    } finally {
      await teardown(fixture);
    }
  });
});

describe('Fs.Capability.Rooted owned trees: committed outcomes and recovery', () => {
  it('revalidates canonical root identity after the target disappears', async () => {
    const fixture = await setup();
    try {
      const targetPath = await writeTree(fixture.root);
      const movedRoot = Fs.join(fixture.workspace, 'moved-root');
      let replaced = false;
      const io = withIo({
        remove: async (path, options) => {
          await DEFAULT_IO.remove(path, options);
          if (!replaced && path === targetPath) {
            replaced = true;
            await Deno.rename(fixture.root, movedRoot);
            await Deno.mkdir(fixture.root);
          }
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'generation');
      const lease = await acquired(rooted, target, 'exclusive');

      await expectFailure(() => rooted.Tree.remove(target, { lease }), 'unsafe-filesystem', true);
      await Deno.remove(fixture.root);
      await Deno.rename(movedRoot, fixture.root);
      await lease.release();
      expect(await Fs.exists(targetPath)).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('pins exclusive ownership until an in-flight removal settles', async () => {
    const fixture = await setup();
    try {
      const entered = Promise.withResolvers<void>();
      const resume = Promise.withResolvers<void>();
      let paused = false;
      const io = withIo({
        remove: async (path, options) => {
          if (!paused && path.includes('generation')) {
            paused = true;
            entered.resolve();
            await resume.promise;
          }
          await DEFAULT_IO.remove(path, options);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const observer = await createRooted({ root: fixture.root }, io);
      await writeTree(fixture.root);
      const target = await directoryTarget(rooted, 'generation');
      const observedTarget = await directoryTarget(observer, 'generation');
      const lease = await acquired(rooted, target, 'exclusive');

      const removal = rooted.Tree.remove(target, { lease });
      await entered.promise;
      let released = false;
      const release = lease.release().then(() => {
        released = true;
      });
      await Time.wait(20);
      expect(released).to.eql(false);
      expect(await observer.Lease.acquire([observedTarget], { mode: 'shared' })).to.eql({
        kind: 'busy',
        target: observedTarget,
      });

      resume.resolve();
      expect(await removal).to.eql({ kind: 'removed' });
      await release;
      expect(released).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });

  it('reports cancellation after removal commitment and allows retry with the same lease', async () => {
    const fixture = await setup();
    try {
      const controller = new AbortController();
      let removals = 0;
      const io = withIo({
        remove: async (path, options) => {
          await DEFAULT_IO.remove(path, options);
          if (path.includes('generation')) {
            removals += 1;
            if (removals === 1) controller.abort('removed-entry');
          }
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      await writeTree(fixture.root);
      const target = await directoryTarget(rooted, 'generation');
      const lease = await acquired(rooted, target, 'exclusive');

      const before = new AbortController();
      before.abort('before-removal');
      await expectFailure(
        () => rooted.Tree.remove(target, { lease, until: before.signal }),
        'cancelled',
      );
      expect(await Fs.exists(Fs.join(fixture.root, target.path))).to.eql(true);

      await expectFailure(
        () => rooted.Tree.remove(target, { lease, until: controller.signal }),
        'cancelled',
        true,
      );
      expect(await rooted.Tree.remove(target, { lease })).to.eql({ kind: 'removed' });
      await lease.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('retries private-stage cleanup after a committed partial discard', async () => {
    const fixture = await setup();
    try {
      let failed = false;
      const io = withIo({
        remove: async (path, options) => {
          if (!failed && Fs.basename(path) === 'owner') {
            failed = true;
            throw new Error('marker removal failed');
          }
          await DEFAULT_IO.remove(path, options);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const stage = await rooted.Stage.create();
      const container = Fs.dirname(stage.path);
      await fillStage(stage);

      await expectFailure(() => rooted.Stage.discard(stage), 'io-failure', true);
      expect(await Fs.exists(container)).to.eql(true);
      expect(await Fs.exists(stage.path)).to.eql(false);
      await rooted.Stage.discard(stage);
      expect(await Fs.exists(container)).to.eql(false);
    } finally {
      await teardown(fixture);
    }
  });

  it('reports committed when permission restoration changes mode before throwing', async () => {
    const fixture = await setup();
    try {
      const sealer = await Fs.Capability.Rooted.create({ root: fixture.root });
      await writeTree(fixture.root);
      const sealedTarget = await directoryTarget(sealer, 'generation');
      await sealer.Tree.seal(sealedTarget);

      let failed = false;
      const io = withIo({
        openMode: async (path) => {
          const file = await DEFAULT_IO.openMode(path);
          return wrapModeHandle(file, {
            chmod: async (value) => {
              await file.chmod(value);
              if (!failed) {
                failed = true;
                throw new Deno.errors.NotSupported('changed before failure');
              }
            },
          });
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      const target = await directoryTarget(rooted, 'generation');
      const lease = await acquired(rooted, target, 'exclusive');

      await expectFailure(() => rooted.Tree.remove(target, { lease }), 'unsupported', true);
      expect(await rooted.Tree.remove(target, { lease })).to.eql({ kind: 'removed' });
      await lease.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('preserves commitment when post-remove observation fails and completes retry', async () => {
    const fixture = await setup();
    try {
      let removedPath: string | undefined;
      let failed = false;
      const io = withIo({
        remove: async (path, options) => {
          await DEFAULT_IO.remove(path, options);
          if (!failed) removedPath = path;
        },
        lstat: async (path) => {
          if (!failed && path === removedPath) {
            failed = true;
            throw new Error('post-remove observation failed');
          }
          return await DEFAULT_IO.lstat(path);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      await writeTree(fixture.root);
      const target = await directoryTarget(rooted, 'generation');
      const lease = await acquired(rooted, target, 'exclusive');

      await expectFailure(() => rooted.Tree.remove(target, { lease }), 'io-failure', true);
      expect(await rooted.Tree.remove(target, { lease })).to.eql({ kind: 'removed' });
      await lease.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('conservatively reports commitment when remove and reconciliation both fail', async () => {
    const fixture = await setup();
    try {
      let reconcilePath: string | undefined;
      let fail = true;
      const io = withIo({
        remove: async (path, options) => {
          if (fail) {
            reconcilePath = path;
            throw new Error('remove failed');
          }
          await DEFAULT_IO.remove(path, options);
        },
        lstat: async (path) => {
          if (path === reconcilePath) {
            reconcilePath = undefined;
            throw new Error('reconciliation failed');
          }
          return await DEFAULT_IO.lstat(path);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      await writeTree(fixture.root);
      const target = await directoryTarget(rooted, 'generation');
      const lease = await acquired(rooted, target, 'exclusive');

      await expectFailure(() => rooted.Tree.remove(target, { lease }), 'io-failure', true);
      fail = false;
      expect(await rooted.Tree.remove(target, { lease })).to.eql({ kind: 'removed' });
      await lease.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('reports committed when remove fails after deleting an entry and completes retry', async () => {
    const fixture = await setup();
    try {
      let failed = false;
      const io = withIo({
        remove: async (path, options) => {
          await DEFAULT_IO.remove(path, options);
          if (!failed && path.includes('generation')) {
            failed = true;
            throw new Error('failed after removal');
          }
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      await writeTree(fixture.root);
      const target = await directoryTarget(rooted, 'generation');
      const lease = await acquired(rooted, target, 'exclusive');

      await expectFailure(() => rooted.Tree.remove(target, { lease }), 'io-failure', true);
      expect(await rooted.Tree.remove(target, { lease })).to.eql({ kind: 'removed' });
      await lease.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('preserves partial-removal truth and completes a cleanup retry', async () => {
    const fixture = await setup();
    try {
      let removals = 0;
      let failed = false;
      const io = withIo({
        remove: async (path, options) => {
          if (path.includes('generation')) {
            removals += 1;
            if (removals === 2 && !failed) {
              failed = true;
              throw new Error('remove failed');
            }
          }
          await DEFAULT_IO.remove(path, options);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);
      await writeTree(fixture.root);
      const target = await directoryTarget(rooted, 'generation');
      const lease = await acquired(rooted, target, 'exclusive');

      await expectFailure(() => rooted.Tree.remove(target, { lease }), 'io-failure', true);
      expect(await rooted.Tree.remove(target, { lease })).to.eql({ kind: 'removed' });
      await lease.release();
    } finally {
      await teardown(fixture);
    }
  });

  it('fails closed on symlinks and unsupported permission restoration before removal', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const targetPath = await writeTree(fixture.root);
      const target = await directoryTarget(rooted, 'generation');
      const linked = Fs.join(targetPath, 'linked.txt');
      await Deno.mkdir(fixture.outside);
      await Deno.writeTextFile(Fs.join(fixture.outside, 'keep.txt'), 'keep');
      await Deno.symlink(Fs.join(fixture.outside, 'keep.txt'), linked);
      const lease = await acquired(rooted, target, 'exclusive');
      await expectFailure(() => rooted.Tree.remove(target, { lease }), 'unsafe-filesystem');
      expect(await Deno.readTextFile(Fs.join(fixture.outside, 'keep.txt'))).to.eql('keep');
      await Deno.remove(linked);
      await lease.release();

      expect(await rooted.Tree.seal(target)).to.eql({ kind: 'applied', changed: true });
      const unsupported = await createRooted(
        {
          root: fixture.root,
        },
        withIo({
          openMode: async (path) => {
            const file = await DEFAULT_IO.openMode(path);
            return wrapModeHandle(file, {
              chmod: () => Promise.reject(new Deno.errors.NotSupported('restore')),
            });
          },
        }),
      );
      const unsupportedTarget = await directoryTarget(unsupported, 'generation');
      const unsupportedLease = await acquired(unsupported, unsupportedTarget, 'exclusive');
      await expectFailure(
        () => unsupported.Tree.remove(unsupportedTarget, { lease: unsupportedLease }),
        'unsupported',
      );
      expect(await Fs.exists(targetPath)).to.eql(true);
      await unsupportedLease.release();

      const cleanupLease = await acquired(rooted, target, 'exclusive');
      await rooted.Tree.remove(target, { lease: cleanupLease });
      await cleanupLease.release();
    } finally {
      await teardown(fixture);
    }
  });
});
