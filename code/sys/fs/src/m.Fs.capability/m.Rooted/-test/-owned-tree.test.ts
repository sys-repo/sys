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

      const before = await rooted.inspectSeal(target);
      expect(before).to.eql({ kind: 'unsealed' });
      expect(Object.isFrozen(before)).to.eql(true);
      expectTypeOf(before).toEqualTypeOf<t.FsRooted.SealInspection>();

      const applied = await rooted.sealTree(target);
      expect(applied).to.eql({ kind: 'applied', changed: true });
      expect(Object.isFrozen(applied)).to.eql(true);
      expectTypeOf(applied).toEqualTypeOf<t.FsRooted.SealResult>();
      expect(await rooted.inspectSeal(target)).to.eql({ kind: 'sealed' });
      expect((await mode(path)) & 0o222).to.eql(0);
      expect((await mode(Fs.join(path, 'pkg'))) & 0o222).to.eql(0);
      expect((await mode(Fs.join(path, 'dist.json'))) & 0o222).to.eql(0);
      expect(await rooted.sealTree(target)).to.eql({ kind: 'applied', changed: false });

      const lease = await acquired(rooted, target, 'exclusive');
      expect(await rooted.removeTree(target, { lease })).to.eql({ kind: 'removed' });
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
      const stage = await rooted.createStage();
      await fillStage(stage);

      expect(await rooted.inspectSeal(stage)).to.eql({ kind: 'unsealed' });
      const result = await rooted.promoteStage(stage, target, { seal: true });
      expect(result).to.eql({
        kind: 'published',
        seal: { kind: 'applied', changed: true },
      });
      expect(await rooted.inspectSeal(target)).to.eql({ kind: 'sealed' });
      expect(await Fs.exists(stage.path)).to.eql(false);

      const lease = await acquired(rooted, target, 'exclusive');
      await rooted.removeTree(target, { lease });
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
      const stage = await rooted.createStage();
      await fillStage(stage);

      await expectFailure(
        () => rooted.promoteStage(stage, target, { seal: true, until: controller.signal }),
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
      const stage = await rooted.createStage();
      await fillStage(stage);

      const result = await rooted.promoteStage(stage, target, { seal: true });
      expect(result.kind).to.eql('published');
      expect(result.kind === 'published' ? result.seal?.kind : undefined).to.eql('applied');
      expect(result.cleanupError?.kind).to.eql('io-failure');
      expect(result.cleanupError?.committed).to.eql(true);
      expect(await rooted.inspectSeal(target)).to.eql({ kind: 'sealed' });

      const lease = await acquired(rooted, target, 'exclusive');
      await rooted.removeTree(target, { lease });
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
      const stage = await rooted.createStage();
      await fillStage(stage);
      expect(await rooted.sealTree(stage)).to.eql({ kind: 'applied', changed: true });

      const result = await rooted.promoteStage(stage, target);
      expect(result).to.eql({
        kind: 'published',
        seal: { kind: 'applied', changed: true },
      });
      expect(await rooted.inspectSeal(target)).to.eql({ kind: 'sealed' });

      const lease = await acquired(rooted, target, 'exclusive');
      await rooted.removeTree(target, { lease });
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
      const stage = await rooted.createStage();
      await fillStage(stage);

      expect(await rooted.promoteStage(stage, target, { seal: true, lease })).to.eql({
        kind: 'published',
        seal: { kind: 'applied', changed: true },
      });
      expect(await rooted.removeTree(target, { lease })).to.eql({ kind: 'removed' });
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
      const stage = await rooted.createStage();
      await fillStage(stage);
      expect(await rooted.sealTree(stage)).to.eql({ kind: 'applied', changed: true });

      expect(await rooted.promoteStage(stage, target, { seal: true })).to.eql({
        kind: 'occupied',
      });
      expect(await Fs.exists(stage.path)).to.eql(false);

      const lease = await acquired(rooted, target, 'exclusive');
      await rooted.removeTree(target, { lease });
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
        () => sealer.sealTree(sealTarget, { until: controller.signal }),
        'cancelled',
      );
      expect((await mode(Fs.join(fixture.root, 'generation', 'dist.json'))) & 0o200).to.eql(
        0o200,
      );

      await held.release();
      expect(await sealer.sealTree(sealTarget)).to.eql({ kind: 'applied', changed: true });
      const cleanup = await acquired(sealer, sealTarget, 'exclusive');
      await sealer.removeTree(sealTarget, { lease: cleanup });
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

      expect(await rooted.inspectSeal(target, { lease: shared })).to.eql({ kind: 'unsealed' });
      await expectFailure(() => rooted.inspectSeal(target), 'invalid-lease');
      await expectFailure(() => rooted.inspectSeal(alias), 'invalid-lease');
      await expectFailure(() => rooted.inspectSeal(alias, { lease: shared }), 'invalid-lease');
      await expectFailure(() => rooted.sealTree(target, { lease: shared }), 'invalid-lease');
      await shared.release();

      const exclusive = await acquired(rooted, target, 'exclusive');
      expect(await rooted.sealTree(target, { lease: exclusive })).to.eql({
        kind: 'applied',
        changed: true,
      });
      expect(await rooted.inspectSeal(target, { lease: exclusive })).to.eql({ kind: 'sealed' });
      await rooted.removeTree(target, { lease: exclusive });
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
      const stage = await rooted.createStage();
      await fillStage(stage);
      expect(await rooted.inspectSeal(stage)).to.eql({ kind: 'unsupported' });
      expect(await rooted.sealTree(stage)).to.eql({ kind: 'unsupported' });
      await rooted.discardStage(stage);

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
      expect(await noLinks.inspectSeal(noLinksTarget)).to.eql({ kind: 'unsupported' });
      expect(await noLinks.sealTree(noLinksTarget)).to.eql({ kind: 'unsupported' });

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
      const unsupportedStage = await unsupported.createStage();
      await fillStage(unsupportedStage);
      expect(await unsupported.sealTree(unsupportedStage)).to.eql({ kind: 'unsupported' });
      await unsupported.discardStage(unsupportedStage);

      const target = await directoryTarget(unsupported, 'generation');
      const promotionStage = await unsupported.createStage();
      await fillStage(promotionStage);
      await expectFailure(
        () => unsupported.promoteStage(promotionStage, target, { seal: true }),
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
      const stage = await rooted.createStage();
      await fillStage(stage);

      await expectFailure(() => rooted.sealTree(stage), 'unsupported', true);
      await rooted.discardStage(stage);
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
      const unsupportedStage = await unsupported.createStage();
      await fillStage(unsupportedStage);
      await expectFailure(() => unsupported.sealTree(unsupportedStage), 'unsupported', true);
      await unsupported.discardStage(unsupportedStage);

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
      const cancelledStage = await cancelled.createStage();
      await fillStage(cancelledStage);
      await expectFailure(
        () => cancelled.sealTree(cancelledStage, { until: controller.signal }),
        'cancelled',
        true,
      );
      await cancelled.discardStage(cancelledStage);
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
      const stage = await rooted.createStage();
      await fillStage(stage);

      await expectFailure(() => rooted.sealTree(stage), 'ownership-lost', true);
      expect(await Deno.readTextFile(outside)).to.eql('keep');
      expect(await mode(outside)).to.eql(outsideMode);

      const replacedPath = Fs.join(stage.path, 'dist.json');
      await Deno.remove(replacedPath);
      await Deno.rename(moved, replacedPath);
      await rooted.discardStage(stage);
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

      await expectFailure(() => rooted.inspectSeal(target), 'unsafe-filesystem');
      await expectFailure(() => rooted.sealTree(target), 'unsafe-filesystem');
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

      await expectFailure(() => rooted.inspectSeal(target), 'unsafe-filesystem');
      await expectFailure(() => rooted.sealTree(target), 'unsafe-filesystem');
      const lease = await acquired(rooted, target, 'exclusive');
      await expectFailure(() => rooted.removeTree(target, { lease }), 'unsafe-filesystem');
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

      await expectFailure(() => rooted.sealTree(target), 'unsafe-filesystem');
      expect(await mode(outside)).to.eql(outsideMode);
      const lease = await acquired(rooted, target, 'exclusive');
      await expectFailure(() => rooted.removeTree(target, { lease }), 'unsafe-filesystem');
      expect(await Deno.readTextFile(outside)).to.eql('manifest');

      await Deno.remove(outside);
      await rooted.removeTree(target, { lease });
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

      expect(await rooted.sealTree(target)).to.eql({ kind: 'applied', changed: true });
      await Deno.chmod(Fs.join(targetPath, 'pkg', 'main.js'), 0o600);
      chmods.length = 0;

      const lease = await acquired(rooted, target, 'exclusive');
      const removed = await rooted.removeTree(target, { lease });
      expect(removed).to.eql({ kind: 'removed' });
      expect(Object.isFrozen(removed)).to.eql(true);
      expectTypeOf(removed).toEqualTypeOf<t.FsRooted.RemoveTreeResult>();
      expect(await rooted.removeTree(target, { lease })).to.eql({ kind: 'absent' });
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
      expect(await rooted.sealTree(target)).to.eql({ kind: 'applied', changed: true });
      const lease = await acquired(rooted, target, 'exclusive');

      await Deno.chmod(parent, 0o500);
      try {
        await expectFailure(() => rooted.removeTree(target, { lease }), 'permission-denied');
        expect(await rooted.inspectSeal(target, { lease })).to.eql({ kind: 'sealed' });
        expect(await Deno.readTextFile(Fs.join(targetPath, 'dist.json'))).to.eql('manifest');
      } finally {
        await Deno.chmod(parent, 0o700);
      }

      expect(await rooted.removeTree(target, { lease })).to.eql({ kind: 'removed' });
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

      await rooted.removeTree(target, { lease });
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
      const files = await rooted.admit([{ kind: 'file', path: 'asset.js' }]);
      await expectFailure(
        () => rooted.sealTree(files.targets[0] as unknown as t.FsRooted.OwnedTree),
        'invalid-target',
      );

      const foreign = await Fs.Capability.Rooted.create({ root: fixture.root });
      const foreignTarget = await directoryTarget(foreign, 'generation');
      await expectFailure(() => rooted.inspectSeal(foreignTarget), 'foreign-handle');

      const missing = await directoryTarget(rooted, 'generation');
      await expectFailure(() => rooted.inspectSeal(missing), 'missing');
      await expectFailure(() => rooted.sealTree(missing), 'missing');

      const stage = await rooted.createStage();
      await rooted.discardStage(stage);
      await expectFailure(() => rooted.inspectSeal(stage), 'invalid-state');
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects malformed sealing and promotion options through typed promise failures', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const target = await directoryTarget(rooted, 'generation');
      const stage = await rooted.createStage();
      await fillStage(stage);

      await expectFailure(
        () =>
          rooted.inspectSeal(
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
      await expectFailure(() => rooted.sealTree(stage, hostile), 'invalid-options');

      const shared = await acquired(rooted, target, 'shared');
      await expectFailure(() => rooted.inspectSeal(stage, { lease: shared }), 'invalid-lease');
      await expectFailure(
        () => rooted.promoteStage(stage, target, { lease: shared }),
        'invalid-lease',
      );
      expect(await Fs.exists(stage.path)).to.eql(true);
      await shared.release();

      await expectFailure(
        () =>
          rooted.promoteStage(stage, target, {
            seal: 'yes',
          } as unknown as t.FsRooted.PromotionOptions),
        'invalid-options',
      );
      expect(await Fs.exists(stage.path)).to.eql(true);
      await rooted.discardStage(stage);
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
      await expectFailure(() => rooted.removeTree(target, { lease: shared }), 'invalid-lease');
      await shared.release();

      const wrong = await acquired(rooted, other, 'exclusive');
      await expectFailure(() => rooted.removeTree(target, { lease: wrong }), 'invalid-lease');
      await wrong.release();

      const released = await acquired(rooted, target, 'exclusive');
      await released.release();
      await expectFailure(() => rooted.removeTree(target, { lease: released }), 'invalid-lease');

      let synchronous = true;
      const pending = rooted.removeTree(
        target,
        null as unknown as t.FsRooted.RemoveTreeOptions,
      );
      synchronous = false;
      expect(synchronous).to.eql(false);
      await expectFailure(() => pending, 'invalid-options');
      await expectFailure(
        () =>
          rooted.removeTree(target, {
            lease: released,
            until: 'later',
          } as unknown as t.FsRooted.RemoveTreeOptions),
        'invalid-options',
      );
      await expectFailure(
        () => rooted.removeTree(target, {} as t.FsRooted.RemoveTreeOptions),
        'invalid-lease',
      );

      const lease = await acquired(rooted, target, 'exclusive');
      await rooted.removeTree(target, { lease });
      await lease.release();
      const otherLease = await acquired(rooted, other, 'exclusive');
      await rooted.removeTree(other, { lease: otherLease });
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

      await expectFailure(() => rooted.removeTree(target, { lease }), 'unsafe-filesystem', true);
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

      const removal = rooted.removeTree(target, { lease });
      await entered.promise;
      let released = false;
      const release = lease.release().then(() => {
        released = true;
      });
      await Time.wait(20);
      expect(released).to.eql(false);
      expect(await observer.acquireLease([observedTarget], { mode: 'shared' })).to.eql({
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
        () => rooted.removeTree(target, { lease, until: before.signal }),
        'cancelled',
      );
      expect(await Fs.exists(Fs.join(fixture.root, target.path))).to.eql(true);

      await expectFailure(
        () => rooted.removeTree(target, { lease, until: controller.signal }),
        'cancelled',
        true,
      );
      expect(await rooted.removeTree(target, { lease })).to.eql({ kind: 'removed' });
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
      const stage = await rooted.createStage();
      const container = Fs.dirname(stage.path);
      await fillStage(stage);

      await expectFailure(() => rooted.discardStage(stage), 'io-failure', true);
      expect(await Fs.exists(container)).to.eql(true);
      expect(await Fs.exists(stage.path)).to.eql(false);
      await rooted.discardStage(stage);
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
      await sealer.sealTree(sealedTarget);

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

      await expectFailure(() => rooted.removeTree(target, { lease }), 'unsupported', true);
      expect(await rooted.removeTree(target, { lease })).to.eql({ kind: 'removed' });
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

      await expectFailure(() => rooted.removeTree(target, { lease }), 'io-failure', true);
      expect(await rooted.removeTree(target, { lease })).to.eql({ kind: 'removed' });
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

      await expectFailure(() => rooted.removeTree(target, { lease }), 'io-failure', true);
      fail = false;
      expect(await rooted.removeTree(target, { lease })).to.eql({ kind: 'removed' });
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

      await expectFailure(() => rooted.removeTree(target, { lease }), 'io-failure', true);
      expect(await rooted.removeTree(target, { lease })).to.eql({ kind: 'removed' });
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

      await expectFailure(() => rooted.removeTree(target, { lease }), 'io-failure', true);
      expect(await rooted.removeTree(target, { lease })).to.eql({ kind: 'removed' });
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
      await expectFailure(() => rooted.removeTree(target, { lease }), 'unsafe-filesystem');
      expect(await Deno.readTextFile(Fs.join(fixture.outside, 'keep.txt'))).to.eql('keep');
      await Deno.remove(linked);
      await lease.release();

      expect(await rooted.sealTree(target)).to.eql({ kind: 'applied', changed: true });
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
        () => unsupported.removeTree(unsupportedTarget, { lease: unsupportedLease }),
        'unsupported',
      );
      expect(await Fs.exists(targetPath)).to.eql(true);
      await unsupportedLease.release();

      const cleanupLease = await acquired(rooted, target, 'exclusive');
      await rooted.removeTree(target, { lease: cleanupLease });
      await cleanupLease.release();
    } finally {
      await teardown(fixture);
    }
  });
});
