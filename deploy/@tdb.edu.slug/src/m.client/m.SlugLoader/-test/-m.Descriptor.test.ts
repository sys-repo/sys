import { describe, expect, it } from '../../../-test.ts';
import { type t } from '../common.ts';
import { Descriptor, DescriptorFactory } from '../m.Descriptor.ts';
import { withVideoShardRewrite } from '../u.withVideoShardRewrite.ts';

describe('SlugLoader.Descriptor', () => {
  describe('kinds', () => {
    it('returns deploy-supported descriptor kinds', () => {
      expect(Descriptor.kinds()).to.eql(['slug-tree:fs', 'slug-tree:media:seq']);
    });
  });

  describe('target', () => {
    it('maps filesystem descriptor target', () => {
      const result = Descriptor.target('slug-tree:fs');
      expect(result).to.eql({
        ok: true,
        value: {
          id: 'fs:kb-manifests',
          kind: 'slug-tree:fs',
          descriptorPath: 'kb/-manifests',
          basePath: 'kb/-manifests',
        },
      });
    });

    it('maps media descriptor target', () => {
      const result = Descriptor.target('slug-tree:media:seq');
      expect(result).to.eql({
        ok: true,
        value: {
          id: 'media:program',
          kind: 'slug-tree:media:seq',
          descriptorPath: 'program/-manifests',
          basePath: 'program',
        },
      });
    });
  });

  describe('factory', () => {
    it('creates named targets with stable kind defaults', () => {
      const descriptor = DescriptorFactory.create({
        targets: [
          { id: 'a', kind: 'slug-tree:fs', descriptorPath: 'a', basePath: 'a' },
          { id: 'b', kind: 'slug-tree:fs', descriptorPath: 'b', basePath: 'b' },
        ],
        defaults: { 'slug-tree:fs': 'b' },
      });

      const target = descriptor.target('slug-tree:fs');
      if (!target.ok) throw new Error(target.error.message);
      expect(target.value.id).to.eql('b');
      expect(descriptor.targets().map((m) => m.id)).to.eql(['a', 'b']);
    });
  });

  describe('withVideoShardRewrite', () => {
    it('rewrites media asset hrefs to canonical video origin', async () => {
      const asset: t.SpecTimelineAsset = {
        kind: 'video',
        logicalPath: 'main',
        href: 'main.webm',
        hash: `sha256-${'0'.repeat(64)}`,
        shard: { strategy: 'prefix-range', total: 64, index: 0 },
      };
      const client = withVideoShardRewrite(
        createClient({
          kind: 'slug-tree:media:seq',
          layout: { shard: { video: { strategy: 'prefix-range', total: 64 } } },
          assets: [asset],
        }),
        {
          app: 'https://example.com/',
          cdn: { default: 'https://cdn.example.com/', video: 'https://video.cdn.example.com/' },
        },
      );

      const assets = await client.Timeline.Assets.load();
      if (!assets.ok) throw new Error(assets.error.message);
      expect(assets.value.assets[0].href).to.eql('https://0.video.cdn.example.com/main.webm');
    });

    it('preserves non-media clients unchanged', () => {
      const client = createClient({ kind: 'slug-tree:fs' });
      const result = withVideoShardRewrite(client, {
        app: 'https://example.com/',
        cdn: { default: 'https://cdn.example.com/', video: 'https://video.cdn.example.com/' },
      });
      expect(result).to.equal(client);
    });
  });
});

/**
 * Fixtures
 */

function createClient(args: {
  kind: t.BundleDescriptorKind;
  layout?: t.SlugClientLayout;
  assets?: readonly t.SpecTimelineAsset[];
}): t.SlugClientDescriptor {
  const assets = args.assets ?? [];
  return {
    kind: args.kind,
    docid: 'crdt:sample' as t.StringId,
    baseUrl: 'https://cdn.example.com/program/' as t.StringUrl,
    assetBase: 'https://cdn.example.com/program/' as t.StringUrl,
    layout: args.layout,
    Tree: { load: async () => ({ ok: true, value: {} as t.SlugTreeDoc }) },
    Timeline: {
      Assets: {
        load: async () => ({
          ok: true,
          value: { docid: 'sample' as t.StringId, assets },
        }),
      },
      Playback: {
        load: async <P = unknown>() =>
          ({ ok: true, value: {} as t.SpecTimelineManifest<P> }) as t.SlugClientResult<
            t.SpecTimelineManifest<P>
          >,
      },
      Bundle: {
        load: async <P = unknown>() =>
          ({ ok: true, value: {} as t.SpecTimelineBundle<P> }) as t.SlugClientResult<
            t.SpecTimelineBundle<P>
          >,
      },
    },
    FileContent: {
      index: async () => ({ ok: true, value: {} as t.SlugFileContentIndex }),
      get: async () => ({ ok: true, value: {} as t.SlugFileContentDoc }),
    },
  };
}
