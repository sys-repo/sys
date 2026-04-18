import { describe, expect, it, Path } from '../../../-test.ts';
import { Fs } from '../../common.ts';
import { SlugDataPipeline } from '../mod.ts';

describe('SlugDataPipeline.refreshRoot', () => {
  it('refreshes child mount dists before recomputing root metadata', async () => {
    const root = Path.resolve(import.meta.dirname ?? '.');
    const source = Path.resolve(root, '../../../-test/sample-1');
    const dir = await Fs.makeTempDir();

    try {
      const target = Fs.join(dir.absolute, 'public/data');
      await SlugDataPipeline.stageFolder({
        source,
        target: Fs.join(target, 'sample-one'),
        mount: 'sample-one',
      });
      await SlugDataPipeline.stageFolder({
        source,
        target: Fs.join(target, 'sample-two'),
        mount: 'sample-two',
      });

      const firstRootDist = (await Fs.readJson(Fs.join(target, 'dist.json'))).data as Record<string, unknown> | undefined;
      expect(firstRootDist != null).to.eql(true);
      expect(typeof firstRootDist?.type).to.eql('string');

      await Fs.remove(Fs.join(target, 'sample-one/dist.json'));
      await Fs.remove(Fs.join(target, 'sample-two/dist.json'));
      await Fs.remove(Fs.join(target, 'dist.json'));

      const result = await SlugDataPipeline.refreshRoot({ root: target });

      expect(result.kind).to.eql('refresh-root');
      expect(result.mountsPath).to.eql(Fs.join(target, 'mounts.json'));
      expect(result.distPath).to.eql(Fs.join(target, 'dist.json'));
      expect(await Fs.exists(Fs.join(target, 'sample-one/dist.json'))).to.eql(true);
      expect(await Fs.exists(Fs.join(target, 'sample-two/dist.json'))).to.eql(true);
      expect(await Fs.exists(Fs.join(target, 'dist.json'))).to.eql(true);

      const nextRootDist = (await Fs.readJson(Fs.join(target, 'dist.json'))).data as Record<string, unknown> | undefined;
      expect(nextRootDist != null).to.eql(true);
      expect(typeof nextRootDist?.type).to.eql('string');
    } finally {
      await Fs.remove(dir.absolute);
    }
  });
});
