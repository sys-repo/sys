import { describe, expect, it } from '../../-test.ts';
import { SlugClient, SlugUrl } from '../mod.ts';
import type { t } from '../common.ts';
import type { SpecTimelineAssetsManifest, SpecTimelineManifest, SpecTimelineAsset } from '../t.ts';

const jsonResponse = (body: unknown, options: { status?: number; statusText?: string } = {}) =>
  new Response(JSON.stringify(body), {
    status: options.status ?? 200,
    statusText: options.statusText ?? 'OK',
    headers: { 'content-type': 'application/json' },
  });

const textResponse = (text: string, options: { status?: number; statusText?: string } = {}) =>
  new Response(text, {
    status: options.status ?? 200,
    statusText: options.statusText ?? 'OK',
  });

const stubFetch = (handler: (url: string) => Response) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    return handler(url);
  };
  return () => {
    globalThis.fetch = originalFetch;
  };
};
describe('SlugClient.loadBundleFromEndpoint', () => {
  it('loads assets + playback and resolves normalized hrefs', async () => {
    const docid = 'crdt:bundle-happy' as t.StringId;
    const cleaned = SlugUrl.clean(docid);

    const assets: SpecTimelineAssetsManifest = {
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
        src: {
          kind: 'video',
          logicalPath: '/video/main',
          time: 0 as t.Msecs,
        },
        payload: null,
      },
    ];

    const playback: SpecTimelineManifest = {
      docid: cleaned,
      composition: [{ src: 'video/main' }] as t.Timecode.Composite.Spec,
      beats,
    };

    const cleanup = stubFetch((url) => {
      if (url.includes(SlugUrl.assetsFilename(cleaned))) return jsonResponse(assets);
      if (url.includes(SlugUrl.playbackFilename(cleaned))) return jsonResponse(playback);
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const baseUrl = 'http://example.com/';
    const base = new URL(baseUrl);
    const basePath = base.pathname.replace(/\/$/, '');

    try {
      const result = await SlugClient.loadBundleFromEndpoint('http://example.com/', docid);
      if (!result.ok) throw new Error('expected bundle result');
      expect(result.ok).to.eql(true);

      const bundle = result.value;
      expect(bundle.docid).to.eql(cleaned);
      expect(bundle.spec.composition).to.eql(playback.composition);
      expect(bundle.spec.beats).to.eql(playback.beats);

      const assetA = bundle.resolveAsset({ kind: 'video', logicalPath: '/video/main' });
      expect(assetA).to.not.eql(undefined);
      expect(assetA?.href).to.eql(new URL(`${basePath}/video/main.mp4`, base.origin).toString());

      const assetB = bundle.resolveAsset({ kind: 'image', logicalPath: 'image/rel' });
      expect(assetB?.href).to.eql(new URL('relative/pic.png', base.href).toString());

      const assetC = bundle.resolveAsset({ kind: 'video', logicalPath: 'video/remote' });
      expect(assetC?.href).to.eql('https://assets.example.com/remote.mp4');
    } finally {
      cleanup();
    }
  });

  it('returns http metadata when manifest fetch fails', async () => {
    const docid = 'crdt:bundle-http' as t.StringId;
    const cleaned = SlugUrl.clean(docid);

    const cleanup = stubFetch((url) => {
      if (url.includes(SlugUrl.assetsFilename(cleaned)))
        return textResponse('Service Unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      if (url.includes(SlugUrl.playbackFilename(cleaned)))
        return jsonResponse({
          docid: cleaned,
          composition: [],
          beats: [],
        } as SpecTimelineManifest);
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await SlugClient.loadBundleFromEndpoint('http://example.com/', docid);
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected http error');
      expect(result.error.kind).to.eql('http');
      if (result.error.kind !== 'http') throw new Error('expected http failure');
      expect(result.error.status).to.eql(503);
      expect(result.error.url).to.include(SlugUrl.assetsFilename(cleaned));
    } finally {
      cleanup();
    }
  });

  it('returns schema info when playback manifest is invalid', async () => {
    const docid = 'crdt:bundle-schema' as t.StringId;
    const cleaned = SlugUrl.clean(docid);

    const assets: SpecTimelineAssetsManifest = {
      docid: cleaned,
      assets: [
        {
          kind: 'video',
          logicalPath: 'asset',
          hash: 'hash-asset',
          filename: 'asset.mp4',
          href: '/asset',
        } as SpecTimelineAsset,
      ],
    };

    const cleanup = stubFetch((url) => {
      if (url.includes(SlugUrl.assetsFilename(cleaned))) return jsonResponse(assets);
      if (url.includes(SlugUrl.playbackFilename(cleaned)))
        return jsonResponse({
          docid: cleaned,
          composition: assets.assets,
        } as unknown as SpecTimelineManifest);
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await SlugClient.loadBundleFromEndpoint('http://example.com/', docid);
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected schema error');
      expect(result.error.kind).to.eql('schema');
      if (result.error.kind !== 'schema') throw new Error('expected schema failure');
      expect(result.error.message).to.include('Playback manifest failed');
    } finally {
      cleanup();
    }
  });

  it('reports schema errors when docids do not match', async () => {
    const docid = 'crdt:bundle-docid' as t.StringId;
    const cleaned = SlugUrl.clean(docid);

    const mismatchedAssets: SpecTimelineAssetsManifest = {
      docid: 'other-doc',
      assets: [
        {
          kind: 'video',
          logicalPath: 'asset',
          hash: 'hash-asset',
          filename: 'asset.mp4',
          href: '/asset',
        } as SpecTimelineAsset,
      ],
    };

    const cleanup = stubFetch((url) => {
      if (url.includes(SlugUrl.assetsFilename(cleaned))) return jsonResponse(mismatchedAssets);
      if (url.includes(SlugUrl.playbackFilename(cleaned)))
        return jsonResponse({
          docid: cleaned,
          composition: [],
          beats: [],
        } as SpecTimelineManifest);
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await SlugClient.loadBundleFromEndpoint('http://example.com/', docid);
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected schema mismatch');
      expect(result.error.kind).to.eql('schema');
      if (result.error.kind !== 'schema') throw new Error('expected schema mismatch');
      expect(result.error.message).to.include('docid mismatch');
    } finally {
      cleanup();
    }
  });
});
