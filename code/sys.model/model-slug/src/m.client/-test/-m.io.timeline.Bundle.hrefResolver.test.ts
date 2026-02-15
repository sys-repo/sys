import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import type { t } from '../common.ts';
import { SlugClient } from '../mod.ts';
import { Dist } from '../u.io.Dist.ts';
import { jsonResponse, stubFetch } from './u.fixture.ts';

describe('SlugClient.Timeline.Bundle: hrefResolver', () => {
  describe('SlugClient.Timeline.Bundle hrefResolver types', () => {
    it('uses media-seq asset kinds for timeline resolver', () => {
      type Resolver = t.SlugTimelineBundleHrefResolver;
      type Args = Parameters<Resolver>[0];
      const kind = null as unknown as Args['kind'];
      expectTypeOf(kind).toEqualTypeOf<t.BundleDescriptorSlugTreeMediaSeqAssetKind | undefined>();
    });

    it('supports fs asset kinds via generic resolver', () => {
      type Resolver = t.SlugBundleHrefResolver<t.BundleDescriptorSlugTreeFsAssetKind>;
      type Args = Parameters<Resolver>[0];
      const kind = null as unknown as Args['kind'];
      expectTypeOf(kind).toEqualTypeOf<t.BundleDescriptorSlugTreeFsAssetKind | undefined>();
    });
  });
});

describe('SlugClient.FromEndpoint.Timeline.Bundle.load (hrefResolver)', () => {
  const docid = 'crdt:bundle-href' as t.StringId;
  const makeDist = (parts: string[]): t.DistPkg => {
    const hashParts: Record<string, t.StringFileHashUri> = {};
    for (const part of parts) hashParts[part] = 'sha256-abc:bytes-0';
    return {
      type: 'https://example.com/src/types/t.Pkg.dist.ts',
      pkg: { name: 'slug-client', version: '0.0.1' },
      build: {
        time: 0 as t.UnixTimestamp,
        size: { total: 0, pkg: 0 },
        builder: 'slug-client@0.0.1',
        runtime: 'deno=1:v8=1:typescript=5',
        hash: { policy: 'https://jsr.io/@sys/fs/0.0.225/src/m.Pkg/m.Pkg.Dist.ts' },
      },
      entry: '',
      url: { base: '/' },
      hash: { digest: 'sha256-def', parts: hashParts as t.CompositeHashParts },
    };
  };

  it('overrides hrefs per asset kind', async () => {
    const cleaned = SlugClient.Url.Util.cleanDocid(docid);
    const assetsManifest: t.SpecTimelineAssetsManifest = {
      docid: cleaned,
      assets: [
        {
          kind: 'video',
          logicalPath: '/video/a.mp4',
          hash: 'hash-video',
          filename: 'a.mp4',
          href: '/video/a.mp4',
        },
        {
          kind: 'image',
          logicalPath: '/image/b.jpg',
          hash: 'hash-image',
          filename: 'b.jpg',
          href: '/image/b.jpg',
        },
      ],
    };

    const playbackManifest: t.SpecTimelineManifest = {
      docid: cleaned,
      composition: [{ src: 'video/a.mp4' }] as t.Timecode.Composite.Spec,
      beats: [
        {
          src: { kind: 'video', logicalPath: '/video/a.mp4', time: 0 as t.Msecs },
          payload: null,
        },
      ],
    };

    const dist = makeDist([
      SlugClient.Url.assetsFilename(cleaned),
      SlugClient.Url.playbackFilename(cleaned),
    ]);

    const cleanup = stubFetch((url) => {
      if (url.includes('dist.json')) return jsonResponse(dist);
      if (url.includes(SlugClient.Url.assetsFilename(cleaned))) return jsonResponse(assetsManifest);
      if (url.includes(SlugClient.Url.playbackFilename(cleaned)))
        return jsonResponse(playbackManifest);
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      Dist.invalidate('http://example.com/');
      const result = await SlugClient.FromEndpoint.Timeline.Bundle.load('http://example.com/', docid, {
        hrefResolver: ({ href, kind }) => {
          const path = new URL(href).pathname;
          if (kind === 'video') return `https://video.example.com${path}`;
          if (kind === 'image') return `https://images.example.com${path}`;
          return href;
        },
      });

      if (!result.ok) throw new Error('expected bundle result');
      const assetVideo = result.value.resolveAsset({ kind: 'video', logicalPath: '/video/a.mp4' });
      const assetImage = result.value.resolveAsset({ kind: 'image', logicalPath: '/image/b.jpg' });

      expect(assetVideo?.href).to.eql('https://video.example.com/video/a.mp4');
      expect(assetImage?.href).to.eql('https://images.example.com/image/b.jpg');
    } finally {
      cleanup();
    }
  });
});
