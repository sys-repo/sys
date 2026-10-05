import { describe, expect, it } from '../../-test.ts';
import { SlugClient as SlugClientBase } from '../mod.ts';
import { Dist } from '../u.io.Dist.ts';

import { Hash, Http, Pkg, Shard, type t } from '../common.ts';
import { jsonResponse, LOAD_OPTIONS, stubFetch, textResponse } from './u.fixture.ts';

const SlugClient = {
  ...SlugClientBase,
  FromEndpoint: {
    ...SlugClientBase.FromEndpoint,
    Timeline: {
      ...SlugClientBase.FromEndpoint.Timeline,
      Bundle: {
        load<P = unknown>(
          baseUrl: t.StringUrl,
          docid: t.StringId,
          options: t.SlugScopedTimelineBundleLoadOptions = {},
        ) {
          return SlugClientBase.FromEndpoint.Timeline.Bundle.load<P>(baseUrl, docid, {
            ...LOAD_OPTIONS,
            ...options,
          });
        },
      },
    },
  },
};

const baseUrl = 'http://example.com/';

const makeDist = (parts: string[]): t.DistPkg => {
  const hashParts: Record<string, t.StringFileHashUri> = {};
  for (const part of parts) {
    hashParts[part] =
      'sha256-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:size=0';
  }

  return {
    type: 'https://example.com/src/types/t.Pkg.dist.ts',
    pkg: { name: 'slug-client', version: '0.0.1' },
    build: {
      time: 0,
      size: { total: 0, pkg: 0 },
      builder: 'slug-client@0.0.1',
      runtime: 'deno=1:v8=1:typescript=5',
      hash: { policy: 'https://jsr.io/@sys/fs/0.0.225/src/m.Pkg/m.Pkg.Dist.ts' },
    },
    hash: {
      scheme: 'sys.dist/v2',
      digest: Hash.sha256(Pkg.Dist.Content.encode(hashParts)),
      parts: hashParts,
    },
  };
};

describe('SlugClient.FromEndpoint.Timeline.Bundle.load', () => {
  it('loads assets + playback and resolves normalized hrefs', async () => {
    const docid: t.StringId = 'crdt:bundle-happy';
    const cleaned = SlugClient.Url.Util.cleanDocid(docid);

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
        src: { kind: 'video', logicalPath: '/video/main', time: 0 },
        payload: null,
      },
    ];

    const playback: t.SpecTimelineManifest = {
      docid: cleaned,
      composition: [{ src: 'video/main' }],
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
      const result = await SlugClient.FromEndpoint.Timeline.Bundle.load(baseUrl, docid);
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

  it('loads dist and timeline manifests from urls.manifestBase', async () => {
    const docid: t.StringId = 'crdt:bundle-manifest-base';
    const cleaned = SlugClient.Url.Util.cleanDocid(docid);
    const dist = makeDist([SlugClient.Url.playbackFilename(cleaned)]);
    const playback: t.SpecTimelineManifest = {
      docid: cleaned,
      composition: [{ src: 'video/main' }],
      beats: [
        {
          src: {
            kind: 'video',
            logicalPath: '/video/main',
            time: 0,
          },
          payload: null,
        },
      ],
    };

    const seen: string[] = [];
    const cleanup = stubFetch((url) => {
      seen.push(url);
      if (url.includes('dist.json')) return jsonResponse(dist);
      if (url.includes(SlugClient.Url.playbackFilename(cleaned))) return jsonResponse(playback);
      if (url.includes(SlugClient.Url.assetsFilename(cleaned))) {
        throw new Error('assets manifest should not be fetched');
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      Dist.invalidate(baseUrl);
      const result = await SlugClient.FromEndpoint.Timeline.Bundle.load(baseUrl, docid, {
        urls: { manifestBase: 'http://manifests.example.com/' },
      });
      if (!result.ok) throw new Error('expected bundle result');
      expect(seen.some((url) => url.includes('http://manifests.example.com'))).to.eql(true);
      expect(seen.some((url) => url.includes('http://example.com/manifests'))).to.eql(false);
    } finally {
      cleanup();
    }
  });

  it('owned clients → Dist reuse, separate bases/clients and invalidation', async () => {
    const policy = LOAD_OPTIONS.policy;
    if (!policy) throw new Error('Expected fixture transport policy.');
    using clientA = Http.fetcher({ policy });
    using clientB = Http.fetcher({ policy });
    const docidA = 'crdt:bundle-dist-cache-a';
    const docidB = 'crdt:bundle-dist-cache-b';
    const cleanedA = SlugClient.Url.Util.cleanDocid(docidA);
    const cleanedB = SlugClient.Url.Util.cleanDocid(docidB);
    const manifestA = 'http://manifests-a.example.com/';
    const manifestB = 'http://manifests-b.example.com/';
    const distUrlA = `${manifestA}-manifests/dist.json`;
    const distUrlB = `${manifestB}-manifests/dist.json`;
    const playbackKeyA = SlugClient.Url.playbackFilename(cleanedA);
    const playbackKeyB = SlugClient.Url.playbackFilename(cleanedB);
    const distA = makeDist([playbackKeyA]);
    const distB = makeDist([playbackKeyB]);
    const seen: string[] = [];
    const cleanup = stubFetch((url) => {
      seen.push(url);
      if (url === distUrlA) return jsonResponse(distA);
      if (url === distUrlB) return jsonResponse(distB);
      if (url === `${manifestA}-manifests/${playbackKeyA}`) {
        return jsonResponse({ docid: cleanedA, composition: [], beats: [] });
      }
      if (url === `${manifestB}-manifests/${playbackKeyB}`) {
        return jsonResponse({ docid: cleanedB, composition: [], beats: [] });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    const load = (docid: t.StringId, manifestBase: t.StringUrl, client: t.HttpFetch.Instance) =>
      SlugClientBase.FromEndpoint.Timeline.Bundle.load(baseUrl, docid, {
        client,
        urls: { manifestBase },
      });
    const distRequests = () => seen.filter((url) => url.endsWith('/dist.json'));
    try {
      const first = await load(docidA, manifestA, clientA);
      if (!first.ok) throw new Error(first.error.message);
      expect(first.value.docid).to.eql(cleanedA);
      expect(distRequests()).to.eql([distUrlA]);
      expect((await load(docidA, manifestA, clientA)).ok).to.eql(true);
      expect(distRequests()).to.eql([distUrlA]);

      const otherBase = await load(docidB, manifestB, clientA);
      if (!otherBase.ok) throw new Error(otherBase.error.message);
      expect(otherBase.value.docid).to.eql(cleanedB);
      expect((await load(docidA, manifestA, clientA)).ok).to.eql(true);
      expect(distRequests()).to.eql([distUrlA, distUrlB]);
      expect((await load(docidA, manifestA, clientB)).ok).to.eql(true);
      expect(distRequests()).to.eql([distUrlA, distUrlB, distUrlA]);

      Dist.invalidate(baseUrl);
      expect((await load(docidA, manifestA, clientA)).ok).to.eql(true);
      expect(distRequests()).to.eql([distUrlA, distUrlB, distUrlA, distUrlA]);
      // Only Dist is cached: each successful bundle load still acquires its playback manifest.
      expect(seen.filter((url) => url.endsWith(playbackKeyA))).to.have.length(5);
      expect(seen.filter((url) => url.endsWith(playbackKeyB))).to.have.length(1);
    } finally {
      cleanup();
    }
  });

  for (const failure of ['schema', 'http'] as const) {
    it(`${failure} Dist refusal → retry and cache only the admitted observation`, async () => {
      const policy = LOAD_OPTIONS.policy;
      if (!policy) throw new Error('Expected fixture transport policy.');
      using client = Http.fetcher({ policy });
      const docid = `crdt:bundle-dist-retry-${failure}`;
      const cleaned = SlugClient.Url.Util.cleanDocid(docid);
      const playbackKey = SlugClient.Url.playbackFilename(cleaned);
      const dist = makeDist([playbackKey]);
      let distRequests = 0;
      let playbackRequests = 0;
      const cleanup = stubFetch((url) => {
        if (url.endsWith('/dist.json')) {
          if (++distRequests > 1) return jsonResponse(dist);
          return failure === 'schema'
            ? jsonResponse({})
            : textResponse('Unavailable', { status: 503, statusText: 'Unavailable' });
        }
        if (url.endsWith(playbackKey)) {
          playbackRequests++;
          return jsonResponse({ docid: cleaned, composition: [], beats: [] });
        }
        throw new Error(`Unexpected fetch: ${url}`);
      });
      try {
        const load = () =>
          SlugClientBase.FromEndpoint.Timeline.Bundle.load(baseUrl, docid, { client });
        const refused = await load();
        expect(refused.ok).to.eql(false);
        if (refused.ok) throw new Error('Expected invalid Dist refusal.');
        expect(refused.error.kind).to.eql(failure);
        expect(distRequests).to.eql(1);
        expect(playbackRequests).to.eql(0);

        const retried = await load();
        if (!retried.ok) throw new Error(retried.error.message);
        expect(retried.value.docid).to.eql(cleaned);
        expect(distRequests).to.eql(2);
        expect((await load()).ok).to.eql(true);
        expect(distRequests).to.eql(2);
        expect(playbackRequests).to.eql(2);
      } finally {
        cleanup();
      }
    });
  }

  it('policy-only transport → no client-owned Dist cache', async () => {
    const docid = 'crdt:bundle-dist-uncached';
    const cleaned = SlugClient.Url.Util.cleanDocid(docid);
    const playbackKey = SlugClient.Url.playbackFilename(cleaned);
    const dist = makeDist([playbackKey]);
    let distRequests = 0;
    const cleanup = stubFetch((url) => {
      if (url.endsWith('/dist.json')) {
        distRequests++;
        return jsonResponse(dist);
      }
      if (url.endsWith(playbackKey)) {
        return jsonResponse({ docid: cleaned, composition: [], beats: [] });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    try {
      for (const attempt of [1, 2]) {
        const result = await SlugClient.FromEndpoint.Timeline.Bundle.load(baseUrl, docid);
        if (!result.ok) throw new Error(result.error.message);
        expect(result.value.docid).to.eql(cleaned);
        expect(distRequests).to.eql(attempt);
      }
      expect(distRequests).to.eql(2);
    } finally {
      cleanup();
    }
  });

  it('resolves hrefs against the provided assetBase', async () => {
    const docid: t.StringId = 'crdt:bundle-basehref';
    const cleaned = SlugClient.Url.Util.cleanDocid(docid);

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
      composition: [{ src: 'video/main' }],
      beats: [
        {
          src: {
            kind: 'video',
            logicalPath: '/video/main',
            time: 0,
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

    const assetBase = 'https://cdn.example.com/prefix/';
    const assetBaseUrl = new URL(assetBase);
    const assetBasePath = assetBaseUrl.pathname.replace(/\/$/, '');

    try {
      Dist.invalidate(baseUrl);
      const result = await SlugClient.FromEndpoint.Timeline.Bundle.load(baseUrl, docid, {
        urls: { assetBase },
      });
      if (!result.ok) throw new Error('expected bundle result');
      const bundle = result.value;

      const assetA = bundle.resolveAsset({
        kind: 'video',
        logicalPath: '/video/main',
      });
      expect(assetA?.href).to.eql(
        new URL(`${assetBasePath}/video/main.mp4`, assetBaseUrl.origin).toString(),
      );

      const assetB = bundle.resolveAsset({
        kind: 'image',
        logicalPath: 'image/rel',
      });
      expect(assetB?.href).to.eql(new URL('relative/pic.png', assetBase).toString());
    } finally {
      cleanup();
    }
  });

  it('rewrites production asset hosts using layout.shard policy + asset hash', async () => {
    const docid: t.StringId = 'crdt:bundle-shard-rewrite-prod';
    const cleaned = SlugClient.Url.Util.cleanDocid(docid);
    const hash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const expectedIndex = Shard.policy(64).pick(hash);

    const assets: t.SpecTimelineAssetsManifest = {
      docid: cleaned,
      assets: [
        {
          kind: 'video',
          logicalPath: '/video/main',
          hash,
          filename: 'main.webm',
          href: '/main.webm',
        },
      ],
    };

    const playback: t.SpecTimelineManifest = {
      docid: cleaned,
      composition: [{ src: 'video/main' }],
      beats: [],
    };

    const dist = makeDist([
      SlugClient.Url.assetsFilename(cleaned),
      SlugClient.Url.playbackFilename(cleaned),
    ]);
    const cleanup = stubFetch((url) => {
      if (url.includes('manifests/dist.json')) return jsonResponse(dist);
      if (url.includes(SlugClient.Url.assetsFilename(cleaned))) return jsonResponse(assets);
      if (url.includes(SlugClient.Url.playbackFilename(cleaned))) return jsonResponse(playback);
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const assetBase = 'https://video.cdn.example.com/sample/';
    try {
      Dist.invalidate(baseUrl);
      const result = await SlugClient.FromEndpoint.Timeline.Bundle.load(baseUrl, docid, {
        urls: { assetBase },
        layout: { shard: { video: { strategy: 'prefix-range', total: 64 } } },
      });
      if (!result.ok) {
        throw new Error(`expected bundle result (${result.error.kind}): ${result.error.message}`);
      }

      const rewritten = result.value.resolveAsset({ kind: 'video', logicalPath: '/video/main' });
      expect(rewritten?.href).to.eql(
        `https://${expectedIndex}.video.cdn.example.com/sample/main.webm`,
      );
    } finally {
      cleanup();
    }
  });

  it('does not rewrite shard host when assetBase host is localhost', async () => {
    const docid: t.StringId = 'crdt:bundle-shard-rewrite-localhost';
    const cleaned = SlugClient.Url.Util.cleanDocid(docid);
    const hash = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

    const assets: t.SpecTimelineAssetsManifest = {
      docid: cleaned,
      assets: [
        {
          kind: 'video',
          logicalPath: '/video/main',
          filename: 'main.webm',
          href: '/main.webm',
          hash,
        },
      ],
    };

    const playback: t.SpecTimelineManifest = {
      docid: cleaned,
      composition: [{ src: 'video/main' }],
      beats: [],
    };

    const dist = makeDist([
      SlugClient.Url.assetsFilename(cleaned),
      SlugClient.Url.playbackFilename(cleaned),
    ]);
    const cleanup = stubFetch((url) => {
      if (url.includes('manifests/dist.json')) return jsonResponse(dist);
      if (url.includes(SlugClient.Url.assetsFilename(cleaned))) return jsonResponse(assets);
      if (url.includes(SlugClient.Url.playbackFilename(cleaned))) return jsonResponse(playback);
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const assetBase = 'http://localhost:4040/staging/slc.cdn.video/';
    try {
      Dist.invalidate(baseUrl);
      const result = await SlugClient.FromEndpoint.Timeline.Bundle.load(baseUrl, docid, {
        urls: { assetBase },
        layout: { shard: { video: { strategy: 'prefix-range', total: 64 } } },
      });
      if (!result.ok) throw new Error('expected bundle result');

      const asset = result.value.resolveAsset({ kind: 'video', logicalPath: '/video/main' });
      expect(asset?.href).to.eql('http://localhost:4040/staging/slc.cdn.video/main.webm');
    } finally {
      cleanup();
    }
  });

  it('rewrites localhost path to local shard directory when path policy is root-filename', async () => {
    const docid: t.StringId = 'crdt:bundle-shard-rewrite-localhost-root';
    const cleaned = SlugClient.Url.Util.cleanDocid(docid);
    const hash = 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';
    const expectedIndex = Shard.policy(64).pick(hash);

    const assets: t.SpecTimelineAssetsManifest = {
      docid: cleaned,
      assets: [
        {
          kind: 'video',
          logicalPath: '/video/main',
          filename: 'main.webm',
          href: '/assets/shard.46/main.webm',
          hash,
        },
      ],
    };

    const playback: t.SpecTimelineManifest = {
      docid: cleaned,
      composition: [{ src: 'video/main' }],
      beats: [],
    };

    const dist = makeDist([
      SlugClient.Url.assetsFilename(cleaned),
      SlugClient.Url.playbackFilename(cleaned),
    ]);
    const cleanup = stubFetch((url) => {
      if (url.includes('manifests/dist.json')) return jsonResponse(dist);
      if (url.includes(SlugClient.Url.assetsFilename(cleaned))) return jsonResponse(assets);
      if (url.includes(SlugClient.Url.playbackFilename(cleaned))) return jsonResponse(playback);
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const assetBase = 'http://localhost:4040/staging/slc.cdn.video/';
    try {
      Dist.invalidate(baseUrl);
      const result = await SlugClient.FromEndpoint.Timeline.Bundle.load(baseUrl, docid, {
        urls: { assetBase },
        layout: {
          shard: {
            video: {
              strategy: 'prefix-range',
              total: 64,
              host: 'prefix-shard',
              path: 'root-filename',
            },
          },
        },
      });
      if (!result.ok) throw new Error('expected bundle result');

      const asset = result.value.resolveAsset({ kind: 'video', logicalPath: '/video/main' });
      expect(asset?.href).to.eql(
        `http://localhost:4040/staging/slc.cdn.video/shard.${expectedIndex}/main.webm`,
      );
    } finally {
      cleanup();
    }
  });

  it('rewrites production asset host and root-filename path from layout shard policy', async () => {
    const docid: t.StringId = 'crdt:bundle-shard-rewrite-prod-root';
    const cleaned = SlugClient.Url.Util.cleanDocid(docid);
    const hash = 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
    const expectedIndex = Shard.policy(64).pick(hash);

    const assets: t.SpecTimelineAssetsManifest = {
      docid: cleaned,
      assets: [
        {
          kind: 'video',
          logicalPath: '/video/main',
          hash,
          filename: 'main.webm',
          href: '/assets/shard.46/main.webm',
        },
      ],
    };

    const playback: t.SpecTimelineManifest = {
      docid: cleaned,
      composition: [{ src: 'video/main' }],
      beats: [],
    };

    const dist = makeDist([
      SlugClient.Url.assetsFilename(cleaned),
      SlugClient.Url.playbackFilename(cleaned),
    ]);
    const cleanup = stubFetch((url) => {
      if (url.includes('manifests/dist.json')) return jsonResponse(dist);
      if (url.includes(SlugClient.Url.assetsFilename(cleaned))) return jsonResponse(assets);
      if (url.includes(SlugClient.Url.playbackFilename(cleaned))) return jsonResponse(playback);
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const assetBase = 'https://video.cdn.example.com/';
    try {
      Dist.invalidate(baseUrl);
      const result = await SlugClient.FromEndpoint.Timeline.Bundle.load(baseUrl, docid, {
        urls: { assetBase },
        layout: {
          shard: {
            video: {
              strategy: 'prefix-range',
              total: 64,
              host: 'prefix-shard',
              path: 'root-filename',
            },
          },
        },
      });
      if (!result.ok) {
        throw new Error(`expected bundle result (${result.error.kind}): ${result.error.message}`);
      }

      const rewritten = result.value.resolveAsset({ kind: 'video', logicalPath: '/video/main' });
      expect(rewritten?.href).to.eql(`https://${expectedIndex}.video.cdn.example.com/main.webm`);
    } finally {
      cleanup();
    }
  });

  it('returns http metadata when manifest fetch fails', async () => {
    const docid: t.StringId = 'crdt:bundle-http';
    const cleaned = SlugClient.Url.Util.cleanDocid(docid);

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
        const playback: t.SpecTimelineManifest = { docid: cleaned, composition: [], beats: [] };
        return jsonResponse(playback);
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      Dist.invalidate(baseUrl);
      const result = await SlugClient.FromEndpoint.Timeline.Bundle.load(baseUrl, docid);
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
    const docid: t.StringId = 'crdt:bundle-schema';
    const cleaned = SlugClient.Url.Util.cleanDocid(docid);

    const assets: t.SpecTimelineAssetsManifest = {
      docid: cleaned,
      assets: [
        {
          kind: 'video',
          logicalPath: 'asset',
          hash: 'hash-asset',
          filename: 'asset.mp4',
          href: '/asset',
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
        // Deliberately malformed wire payload: asset-shaped composition and missing beats.
        return jsonResponse({
          docid: cleaned,
          composition: assets.assets,
        });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      Dist.invalidate(baseUrl);
      const result = await SlugClient.FromEndpoint.Timeline.Bundle.load(baseUrl, docid);
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
    const docid: t.StringId = 'crdt:bundle-docid';
    const cleaned = SlugClient.Url.Util.cleanDocid(docid);

    const mismatchedAssets: t.SpecTimelineAssetsManifest = {
      docid: 'other-doc',
      assets: [
        {
          kind: 'video',
          logicalPath: 'asset',
          hash: 'hash-asset',
          filename: 'asset.mp4',
          href: '/asset',
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
        return jsonResponse(mismatchedAssets);
      }
      if (url.includes(SlugClient.Url.playbackFilename(cleaned))) {
        const playback: t.SpecTimelineManifest = { docid: cleaned, composition: [], beats: [] };
        return jsonResponse(playback);
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      Dist.invalidate(baseUrl);
      const result = await SlugClient.FromEndpoint.Timeline.Bundle.load(baseUrl, docid);
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
