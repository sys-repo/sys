import { describe, expect, it, Path } from '../../../-test.ts';
import { Fs } from '../../common.ts';
import { SlugDataPipeline } from '../mod.ts';

describe('SlugDataPipeline.stageFolder', () => {
  it('stages a representative markdown folder into manifests and content', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    const source = Path.resolve(root, '../../../-test/sample-1');
    const dir = await Fs.makeTempDir();
    try {
      const target = Fs.join(dir.absolute, 'sample-1');
      const exists = (name: string, dir = 'manifests') => Fs.exists(Fs.join(target, dir, name));
      const result = await SlugDataPipeline.stageFolder({ source, target });

      expect(result.ok).to.eql(true);
      expect(result.mount).to.eql('sample-1');
      expect(await exists('slug-tree.sample-1.json')).to.eql(true);
      expect(await exists('slug-tree.sample-1.yaml')).to.eql(true);
      expect(await exists('slug-tree.sample-1.assets.json')).to.eql(true);
      expect(await Fs.exists(Fs.join(target, 'dist.json'))).to.eql(true);
      expect((await Fs.readJson(Fs.join(dir.absolute, 'mounts.json'))).data).to.eql({
        mounts: [{ mount: 'sample-1' }],
      });
      expect(await Fs.exists(Fs.join(dir.absolute, 'dist.json'))).to.eql(true);

      const contentDir = Fs.join(target, 'content');
      const written: string[] = [];
      for await (const entry of Fs.walk(contentDir, {
        includeDirs: false,
        includeFiles: true,
        includeSymlinks: false,
        followSymlinks: false,
      })) {
        written.push(entry.name);
      }
      expect(written.length > 0).to.eql(true);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('uses an explicit mount for staged manifest identity', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    const source = Path.resolve(root, '../../../-test/sample-1');
    const dir = await Fs.makeTempDir();
    try {
      const target = Fs.join(dir.absolute, 'sample-one');
      const exists = (name: string, folder = 'manifests') => Fs.exists(Fs.join(target, folder, name));
      const result = await SlugDataPipeline.stageFolder({ source, target, mount: 'sample-one' });

      expect(result.mount).to.eql('sample-one');
      expect(await exists('slug-tree.sample-one.json')).to.eql(true);
      expect(await exists('slug-tree.sample-one.yaml')).to.eql(true);
      expect(await exists('slug-tree.sample-one.assets.json')).to.eql(true);
      expect(await exists('slug-tree.sample-1.json')).to.eql(false);
      expect(await Fs.exists(Fs.join(target, 'dist.json'))).to.eql(true);
      expect((await Fs.readJson(Fs.join(dir.absolute, 'mounts.json'))).data).to.eql({
        mounts: [{ mount: 'sample-one' }],
      });
      expect(await Fs.exists(Fs.join(dir.absolute, 'dist.json'))).to.eql(true);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });

  it('stages sibling mounts → refreshes root mounts index', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    const source = Path.resolve(root, '../../../-test/sample-1');
    const dir = await Fs.makeTempDir();
    try {
      await SlugDataPipeline.stageFolder({
        source,
        target: Fs.join(dir.absolute, 'sample-b'),
        mount: 'sample-b',
      });
      await SlugDataPipeline.stageFolder({
        source,
        target: Fs.join(dir.absolute, 'sample-a'),
        mount: 'sample-a',
      });

      expect((await Fs.readJson(Fs.join(dir.absolute, 'mounts.json'))).data).to.eql({
        mounts: [{ mount: 'sample-a' }, { mount: 'sample-b' }],
      });
      expect(await Fs.exists(Fs.join(dir.absolute, 'sample-a/dist.json'))).to.eql(true);
      expect(await Fs.exists(Fs.join(dir.absolute, 'sample-b/dist.json'))).to.eql(true);
      expect(await Fs.exists(Fs.join(dir.absolute, 'dist.json'))).to.eql(true);
    } finally {
      await Fs.remove(dir.absolute);
    }
  });
});
