import { describe, expect, it } from '../../../../-test.ts';
import { D } from '../common.ts';
import { SlugBundleTransform } from '../../mod.ts';

describe('u.policy.meta', () => {
  it('derives output metadata for media-seq targets', async () => {
    const result = await SlugBundleTransform.derive({
      dag: {},
      yamlPath: ['slug'],
      docid: 'crdt:abc123',
      target: {
        manifests: {
          base: '/program',
          dir: '-manifests',
          assets: 'slug.<docid>.assets.json',
          playback: 'slug.<docid>.playback.json',
          tree: 'slug-tree.<docid>.json',
        },
        media: {
          image: {
            base: '/program',
            dir: 'image',
          },
          video: {
            base: '/video/program',
            dir: './shard.<shard>/',
            shard: { total: 64, host: 'prefix-shard', path: 'root-filename' },
          },
        },
      },
    });

    expect(result.ok).to.eql(true);
    if (!result.ok) return;

    expect(result.value.docid).to.eql('abc123');
    expect(result.value.dir).to.eql({
      base: '/program',
      manifests: '-manifests',
      video: './shard.<shard>/',
      image: 'image',
    });
    expect(result.value.files.assets).to.eql({
      filename: 'slug.abc123.assets.json',
      path: '/program/-manifests/slug.abc123.assets.json',
      raw: '-manifests/slug.abc123.assets.json',
    });
    expect(result.value.files.playback.raw).to.eql('-manifests/slug.abc123.playback.json');
    expect(result.value.files.tree.raw).to.eql('-manifests/slug-tree.abc123.json');
    expect(result.value.layout.manifestsDir).to.eql('-manifests');
    expect(result.value.layout.mediaDirs).to.eql({ image: 'image' });
    expect(result.value.layout.shard).to.eql({
      video: {
        strategy: 'prefix-range',
        total: 64,
        host: 'prefix-shard',
        path: 'root-filename',
      },
    });
    expect(result.value.issues).to.eql([]);
    expect(result.value.manifests).to.eql({});
  });

  it('uses defaults when target is omitted', async () => {
    const result = await SlugBundleTransform.derive({
      dag: {},
      yamlPath: [] as const as unknown as never,
      docid: 'crdt:z9',
    });

    expect(result.ok).to.eql(true);
    if (!result.ok) return;

    expect(result.value.dir).to.eql({
      base: D.manifestsBase,
      manifests: D.manifestsDir,
      video: D.mediaDirVideo,
      image: D.mediaDirImage,
    });
    expect(result.value.files.assets.filename).to.eql(D.assetsTemplate.replace('<docid>', 'z9'));
    expect(result.value.layout.manifestsDir).to.eql(D.manifestsDir);
    expect(result.value.layout.mediaDirs).to.eql({
      video: D.mediaDirVideo,
      image: D.mediaDirImage,
    });
  });

  it('omits mediaDirs and shard entries for disabled media kinds', async () => {
    const result = await SlugBundleTransform.derive({
      dag: {},
      yamlPath: ['slug'],
      docid: 'crdt:abc123',
      target: {
        manifests: { base: '/program', dir: 'manifests' },
        media: {
          image: { base: '/program', dir: 'image' },
        },
      },
    });

    expect(result.ok).to.eql(true);
    if (!result.ok) return;

    expect(result.value.layout.mediaDirs).to.eql({ image: 'image' });
    expect(result.value.layout.shard).to.eql(undefined);
  });

  it('omits mediaDirs for media bases outside the manifests base', async () => {
    const result = await SlugBundleTransform.derive({
      dag: {},
      yamlPath: ['slug'],
      docid: 'crdt:abc123',
      target: {
        manifests: { base: '/program', dir: 'manifests' },
        media: {
          video: {
            base: '/video/program',
            dir: './shard.<shard>/',
            shard: { total: 32 },
          },
          image: {
            base: '/image/program',
            dir: 'image',
          },
        },
      },
    });

    expect(result.ok).to.eql(true);
    if (!result.ok) return;

    expect(result.value.layout.mediaDirs).to.eql(undefined);
    expect(result.value.layout.shard).to.eql({
      video: {
        strategy: 'prefix-range',
        total: 32,
      },
    });
  });

  it('uses relative descriptors for absolute paths outside manifests base', async () => {
    const result = await SlugBundleTransform.derive({
      dag: {},
      yamlPath: ['slug'],
      docid: 'crdt:abc123',
      target: {
        manifests: {
          base: '/program',
          dir: '/external/manifests',
        },
        media: {
          image: {
            base: '/program',
            dir: '/external/images',
          },
        },
      },
    });

    expect(result.ok).to.eql(true);
    if (!result.ok) return;

    expect(result.value.files.assets.raw).to.eql('../external/manifests/slug.abc123.assets.json');
    expect(result.value.layout.manifestsDir).to.eql('../external/manifests');
    expect(result.value.layout.mediaDirs).to.eql({ image: '../external/images' });
  });
});
