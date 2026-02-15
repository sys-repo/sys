import { describe, expect, Fs, it } from '../../-test.ts';
import { type t, Json, Shard } from '../common.ts';
import { writeDistClientFiles } from '../u.dist.client.ts';

const validBundle: t.BundleDescriptor = {
  kind: 'slug-tree:fs',
  version: 1,
  docid: 'slug:test',
  layout: {
    manifestsDir: 'manifests',
    contentDir: 'content',
  },
  files: {
    tree: 'slug-tree.slug-test.json',
  },
};

describe('BundleDescriptor', () => {
  it('writes `dist.client.json` for valid bundles', async () => {
    const tmpDir = (await Fs.makeTempDir()).absolute;
    try {
      const targetDir = Fs.join(tmpDir, 'manifests');
      const written = await writeDistClientFiles([{ dir: targetDir, bundle: validBundle }]);

      expect(written).to.eql(1);
      expect(await Fs.exists(Fs.join(targetDir, 'dist.client.json'))).to.eql(true);
    } finally {
      await Fs.remove(tmpDir);
    }
  });

  it('throws when schema validation fails', async () => {
    const tmpDir = (await Fs.makeTempDir()).absolute;
    try {
      const targetDir = Fs.join(tmpDir, 'manifests');
      const invalid = {
        kind: 'slug-tree:fs',
        version: 1,
        layout: {
          manifestsDir: 'manifests',
        },
      } as unknown as t.BundleDescriptor;

      let thrown = false;
      try {
        await writeDistClientFiles([{ dir: targetDir, bundle: invalid }]);
      } catch {
        thrown = true;
      }
      expect(thrown).to.eql(true);
    } finally {
      await Fs.remove(tmpDir);
    }
  });

  it('writes media-seq shard policy hints into dist.client.json', async () => {
    const tmpDir = (await Fs.makeTempDir()).absolute;
    try {
      const targetDir = Fs.join(tmpDir, 'manifests');
      const videoPolicy = Shard.policy(64);
      const imagePolicy = Shard.policy(16);
      const mediaBundle: t.BundleDescriptor = {
        kind: 'slug-tree:media:seq',
        version: 1,
        docid: 'slug:media',
        layout: {
          manifestsDir: 'manifests',
          mediaDirs: { video: 'video', image: 'image' },
          shard: {
            video: { strategy: videoPolicy.strategy, total: videoPolicy.shards },
            image: { strategy: imagePolicy.strategy, total: imagePolicy.shards },
          },
        },
        files: {
          assets: 'slug.media.assets.json',
          playback: 'slug.media.playback.json',
          tree: 'slug-tree.media.json',
        },
      };

      const written = await writeDistClientFiles([{ dir: targetDir, bundle: mediaBundle }]);
      expect(written).to.eql(1);

      const path = Fs.join(targetDir, 'dist.client.json');
      const json = (await Fs.readText(path)).data;
      const doc = Json.parse(json) as t.BundleDescriptorDoc;
      const bundle = doc.bundles[0];
      if (bundle.kind !== 'slug-tree:media:seq') throw new Error('Expected media descriptor');
      expect(bundle.layout?.shard?.video).to.eql({
        strategy: videoPolicy.strategy,
        total: videoPolicy.shards,
      });
      expect(bundle.layout?.shard?.image).to.eql({
        strategy: imagePolicy.strategy,
        total: imagePolicy.shards,
      });
    } finally {
      await Fs.remove(tmpDir);
    }
  });
});
