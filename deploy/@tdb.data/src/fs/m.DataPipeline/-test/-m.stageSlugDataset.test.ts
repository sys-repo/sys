import { describe, expect, it, Path } from '../../../-test.ts';
import { Fs } from '../../common.ts';
import { SlugDataPipeline } from '../mod.ts';

describe('SlugDataPipeline.stageSlugDataset', () => {
  it('stages one mount per root slug-tree trait → keeps closure-derived outputs', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    const source = Path.resolve(root, '../../../-test/sample-2.yaml.authored');
    const dir = await Fs.makeTempDir();

    try {
      const target = Fs.join(dir.absolute, 'public/data');
      const result = await SlugDataPipeline.stageSlugDataset({ source, root: target });

      expect(result.ok).to.eql(true);
      expect(result.mounts).to.eql(['prog.core', 'prog.p2p']);
      expect(result.dirs).to.eql([
        Fs.join(target, 'prog.core'),
        Fs.join(target, 'prog.p2p'),
      ]);

      const mounts = (await Fs.readJson(Fs.join(target, 'mounts.json'))).data;
      expect(mounts).to.eql({
        mounts: [{ mount: 'prog.core' }, { mount: 'prog.p2p' }],
      });

      const coreTree = (await Fs.readJson(Fs.join(target, 'prog.core/manifests/slug-tree.prog.core.json')))
        .data as { tree?: unknown[] };
      const p2pTree = (await Fs.readJson(Fs.join(target, 'prog.p2p/manifests/slug-tree.prog.p2p.json')))
        .data as { tree?: unknown[] };
      expect(coreTree.tree?.length).to.eql(2);
      expect(p2pTree.tree?.length).to.eql(2);

      expect(await Fs.exists(Fs.join(target, 'prog.core/manifests/slug-tree.prog.core.assets.json'))).to.eql(true);
      expect(await Fs.exists(Fs.join(target, 'prog.p2p/manifests/slug-tree.prog.p2p.assets.json'))).to.eql(true);
      expect(await Fs.exists(Fs.join(target, 'prog.core/dist.json'))).to.eql(true);
      expect(await Fs.exists(Fs.join(target, 'prog.p2p/dist.json'))).to.eql(true);
      expect(await Fs.exists(Fs.join(target, 'dist.json'))).to.eql(true);

      const coreManifests = await Fs.ls(Fs.join(target, 'prog.core/manifests'), {
        includeDirs: false,
        depth: 1,
      });
      expect(coreManifests.some((path) => Fs.basename(path).endsWith('.playback.json'))).to.eql(true);

      const contentFiles = await Fs.ls(Fs.join(target, 'prog.core/content'), {
        includeDirs: false,
        depth: 1,
      });
      expect(contentFiles.length > 0).to.eql(true);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });
});
