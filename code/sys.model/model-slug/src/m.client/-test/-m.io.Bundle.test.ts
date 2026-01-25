import { describe, expect, it } from '../../-test.ts';
import { SlugClient } from '../mod.ts';
import { Dist } from '../u.io.Dist.ts';

import type { t } from '../common.ts';
import { jsonResponse, stubFetch, textResponse } from './u.fixture.ts';

const baseUrl = 'http://example.com/';

const makeDist = (parts: string[]): t.DistPkg => {
  const hashParts: Record<string, t.StringFileHashUri> = {};
  for (const part of parts) {
    hashParts[part] = 'sha256-abc:bytes-0';
  }

  return {
    type: 'https://example.com/src/types/t.Pkg.dist.ts',
    pkg: { name: 'slug-client', version: '0.0.1' },
    build: {
      time: 0 as t.UnixTimestamp,
      size: { total: 0, pkg: 0 },
      builder: 'slug-client@0.0.1',
      runtime: 'deno=1:v8=1:typescript=5',
    },
    entry: '',
    url: { base: '/' },
    hash: { digest: 'sha256-def', parts: hashParts as t.CompositeHashParts },
  };
};

describe('SlugClient.FromEndpoint.Bundle.load', () => {
  it('loads assets + playback and resolves normalized hrefs', async () => {
    const docid = 'crdt:bundle-happy' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);

    const assets: t.SpecTimelineAssetsManifest = {
      docid: cleaned,
      assets: [
        {
          kind: 'video',
          logicalPath: '/video/main',
          hash: 'hash-video',
          filename: 'main.mp4',
          href: '/video/main.mp4',
          stats: { bytes: 128 },
        },
        {
          kind: 'image',
          logicalPath: 'image/rel',
          hash: 'hash-image',
          filename: 'pic.png',
          href: 'relative/pic.png',
          stats: { bytes: 64 },
        },
        {
          kind: 'video',
          logicalPath: 'video/remote',
          hash: 'hash-remote',
          filename: 'remote.mp4',
          href: 'https://assets.example.com/remote.mp4',
        },
      ],
    };

    const beats: readonly t.Timecode.Playback.Beat<unknown>[] = [
      {
        src: { kind: 'video', logicalPath: '/video/main', time: 0 as t.Msecs },
        payload: null,
      },
    ];

    const playback: t.SpecTimelineManifest = {
      docid: cleaned,
      composition: [{ src: 'video/main' }] as t.Timecode.Composite.Spec,
      beats,
    };

    const dist = makeDist([
      SlugClient.Url.assetsFilename(cleaned),
      SlugClient.Url.playbackFilename(cleaned),
    ]);

    const cleanup = stubFetch((url) => {
      if (url.includes('manifests/dist.json')) return jsonResponse(dist);
      if (url.includes(SlugClient.Url.assetsFilename(cleaned))) {
        return jsonResponse(assets);
      }
      if (url.includes(SlugClient.Url.playbackFilename(cleaned))) {
        return jsonResponse(playback);
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const baseUrl = 'http://example.com/';
    const base = new URL(baseUrl);
    const basePath = base.pathname.replace(/\/$/, '');

    try {
      Dist.invalidate(baseUrl);
      const result = await SlugClient.FromEndpoint.Bundle.load(baseUrl, docid);
      if (!result.ok) throw new Error('expected bundle result');
      expect(result.ok).to.eql(true);

      const bundle = result.value;
      expect(bundle.docid).to.eql(cleaned);
      expect(bundle.spec.composition).to.eql(playback.composition);
      expect(bundle.spec.beats).to.eql(playback.beats);

      const assetA = bundle.resolveAsset({
        kind: 'video',
        logicalPath: '/video/main',
      });
      expect(assetA).to.not.eql(undefined);
      expect(assetA?.href).to.eql(new URL(`${basePath}/video/main.mp4`, base.origin).toString());

      const assetB = bundle.resolveAsset({
        kind: 'image',
        logicalPath: 'image/rel',
      });
      expect(assetB?.href).to.eql(new URL('relative/pic.png', base.href).toString());

      const assetC = bundle.resolveAsset({
        kind: 'video',
        logicalPath: 'video/remote',
      });
      expect(assetC?.href).to.eql('https://assets.example.com/remote.mp4');
    } finally {
      cleanup();
    }
  });

  it('resolves hrefs against the provided baseHref', async () => {
    const docid = 'crdt:bundle-basehref' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);

    const assets: t.SpecTimelineAssetsManifest = {
      docid: cleaned,
      assets: [
        {
          kind: 'video',
          logicalPath: '/video/main',
          hash: 'hash-video',
          filename: 'main.mp4',
          href: '/video/main.mp4',
        },
        {
          kind: 'image',
          logicalPath: 'image/rel',
          hash: 'hash-image',
          filename: 'pic.png',
          href: 'relative/pic.png',
        },
      ],
    };

    const playback: t.SpecTimelineManifest = {
      docid: cleaned,
      composition: [{ src: 'video/main' }] as t.Timecode.Composite.Spec,
      beats: [
        {
          src: {
            kind: 'video',
            logicalPath: '/video/main',
            time: 0 as t.Msecs,
          },
          payload: null,
        },
      ],
    };

    const dist = makeDist([
      SlugClient.Url.assetsFilename(cleaned),
      SlugClient.Url.playbackFilename(cleaned),
    ]);
    const cleanup = stubFetch((url) => {
      if (url.includes('manifests/dist.json')) return jsonResponse(dist);
      if (url.includes(SlugClient.Url.assetsFilename(cleaned))) {
        return jsonResponse(assets);
      }
      if (url.includes(SlugClient.Url.playbackFilename(cleaned))) {
        return jsonResponse(playback);
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const baseHref = 'https://cdn.example.com/prefix/';
    const baseHrefUrl = new URL(baseHref);
    const baseHrefPath = baseHrefUrl.pathname.replace(/\/$/, '');

    try {
      Dist.invalidate(baseUrl);
      const result = await SlugClient.FromEndpoint.Bundle.load(baseUrl, docid, {
        baseHref,
      });
      if (!result.ok) throw new Error('expected bundle result');
      const bundle = result.value;

      const assetA = bundle.resolveAsset({
        kind: 'video',
        logicalPath: '/video/main',
      });
      expect(assetA?.href).to.eql(
        new URL(`${baseHrefPath}/video/main.mp4`, baseHrefUrl.origin).toString(),
      );

      const assetB = bundle.resolveAsset({
        kind: 'image',
        logicalPath: 'image/rel',
      });
      expect(assetB?.href).to.eql(new URL('relative/pic.png', baseHref).toString());
    } finally {
      cleanup();
    }
  });

  it('returns http metadata when manifest fetch fails', async () => {
    const docid = 'crdt:bundle-http' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);

    const dist = makeDist([
      SlugClient.Url.assetsFilename(cleaned),
      SlugClient.Url.playbackFilename(cleaned),
    ]);
    const cleanup = stubFetch((url) => {
      if (url.includes('manifests/dist.json')) return jsonResponse(dist);
      if (url.includes(SlugClient.Url.assetsFilename(cleaned))) {
        return textResponse('Service Unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      }
      if (url.includes(SlugClient.Url.playbackFilename(cleaned))) {
        return jsonResponse({
          docid: cleaned,
          composition: [],
          beats: [],
        } as t.SpecTimelineManifest);
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      Dist.invalidate(baseUrl);
      const result = await SlugClient.FromEndpoint.Bundle.load(baseUrl, docid);
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected http error');
      expect(result.error.kind).to.eql('http');
      if (result.error.kind !== 'http') {
        throw new Error('expected http failure');
      }
      expect(result.error.status).to.eql(503);
      expect(result.error.url).to.include(SlugClient.Url.assetsFilename(cleaned));
    } finally {
      cleanup();
    }
  });

  it('returns schema info when playback manifest is invalid', async () => {
    const docid = 'crdt:bundle-schema' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);

    const assets: t.SpecTimelineAssetsManifest = {
      docid: cleaned,
      assets: [
        {
          kind: 'video',
          logicalPath: 'asset',
          hash: 'hash-asset',
          filename: 'asset.mp4',
          href: '/asset',
        } as t.SpecTimelineAsset,
      ],
    };

    const dist = makeDist([
      SlugClient.Url.assetsFilename(cleaned),
      SlugClient.Url.playbackFilename(cleaned),
    ]);
    const cleanup = stubFetch((url) => {
      if (url.includes('manifests/dist.json')) return jsonResponse(dist);
      if (url.includes(SlugClient.Url.assetsFilename(cleaned))) {
        return jsonResponse(assets);
      }
      if (url.includes(SlugClient.Url.playbackFilename(cleaned))) {
        return jsonResponse({
          docid: cleaned,
          composition: assets.assets,
        } as unknown as t.SpecTimelineManifest);
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      Dist.invalidate(baseUrl);
      const result = await SlugClient.FromEndpoint.Bundle.load(baseUrl, docid);
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected schema error');
      expect(result.error.kind).to.eql('schema');
      if (result.error.kind !== 'schema') {
        throw new Error('expected schema failure');
      }
      expect(result.error.message).to.include('Playback manifest failed');
    } finally {
      cleanup();
    }
  });

  it('reports schema errors when docids do not match', async () => {
    const docid = 'crdt:bundle-docid' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);

    const mismatchedAssets: t.SpecTimelineAssetsManifest = {
      docid: 'other-doc',
      assets: [
        {
          kind: 'video',
          logicalPath: 'asset',
          hash: 'hash-asset',
          filename: 'asset.mp4',
          href: '/asset',
        } as t.SpecTimelineAsset,
      ],
    };

    const dist = makeDist([
      SlugClient.Url.assetsFilename(cleaned),
      SlugClient.Url.playbackFilename(cleaned),
    ]);
    const cleanup = stubFetch((url) => {
      if (url.includes('manifests/dist.json')) return jsonResponse(dist);
      if (url.includes(SlugClient.Url.assetsFilename(cleaned))) {
        return jsonResponse(mismatchedAssets);
      }
      if (url.includes(SlugClient.Url.playbackFilename(cleaned))) {
        return jsonResponse({
          docid: cleaned,
          composition: [],
          beats: [],
        } as t.SpecTimelineManifest);
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      Dist.invalidate(baseUrl);
      const result = await SlugClient.FromEndpoint.Bundle.load(baseUrl, docid);
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected schema mismatch');
      expect(result.error.kind).to.eql('schema');
      if (result.error.kind !== 'schema') {
        throw new Error('expected schema mismatch');
      }
      expect(result.error.message).to.include('docid mismatch');
    } finally {
      cleanup();
    }
  });
});
