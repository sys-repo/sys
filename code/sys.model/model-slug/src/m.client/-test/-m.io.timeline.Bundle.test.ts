import { describe, expect, it } from '../../-test.ts';
import { SlugClient } from '../mod.ts';
import { Dist } from '../u.io.Dist.ts';

import { type t, Shard } from '../common.ts';
import { jsonResponse, stubFetch, textResponse } from './u.fixture.ts';

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
      time: 0 as t.UnixTimestamp,
      size: { total: 0, pkg: 0 },
      builder: 'slug-client@0.0.1',
      runtime: 'deno=1:v8=1:typescript=5',
      hash: { policy: 'https://jsr.io/@sys/fs/0.0.225/src/m.Pkg/m.Pkg.Dist.ts' },
    },
    hash: {
      digest: 'sha256-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      parts: hashParts as t.CompositeHashParts,
    },
  };
};

describe('SlugClient.FromEndpoint.Timeline.Bundle.load', () => {
  it('loads assets + playback and resolves normalized hrefs', async () => {
    const docid = 'crdt:bundle-happy' as t.StringId;
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
    const docid = 'crdt:bundle-manifest-base' as t.StringId;
    const cleaned = SlugClient.Url.Util.cleanDocid(docid);
    const dist = makeDist([SlugClient.Url.playbackFilename(cleaned)]);
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

  it('caches dist by manifestBase', async () => {
    const docidA = 'crdt:bundle-dist-cache-a' as t.StringId;
    const docidB = 'crdt:bundle-dist-cache-b' as t.StringId;
    const cleanedA = SlugClient.Url.Util.cleanDocid(docidA);
    const cleanedB = SlugClient.Url.Util.cleanDocid(docidB);

    const distA = makeDist([SlugClient.Url.playbackFilename(cleanedA)]);
    const distB = makeDist([SlugClient.Url.playbackFilename(cleanedB)]);
    const playbackA: t.SpecTimelineManifest = {
      docid: cleanedA,
      composition: [{ src: 'video/a' }] as t.Timecode.Composite.Spec,
      beats: [],
    };
    const playbackB: t.SpecTimelineManifest = {
      docid: cleanedB,
      composition: [{ src: 'video/b' }] as t.Timecode.Composite.Spec,
      beats: [],
    };

    const cleanup = stubFetch((url) => {
      const res = jsonResponse;
      if (url.includes('http://manifests-a.example.com/-manifests/dist.json')) return res(distA);
      if (url.includes('http://manifests-b.example.com/-manifests/dist.json')) return res(distB);
      if (url.includes(SlugClient.Url.playbackFilename(cleanedA))) return res(playbackA);
      if (url.includes(SlugClient.Url.playbackFilename(cleanedB))) return res(playbackB);
      if (url.includes(SlugClient.Url.assetsFilename(cleanedA))) {
        throw new Error('assets manifest should not be fetched');
      }
      if (url.includes(SlugClient.Url.assetsFilename(cleanedB))) {
        throw new Error('assets manifest should not be fetched');
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      Dist.invalidate(baseUrl);
      const first = await SlugClient.FromEndpoint.Timeline.Bundle.load(baseUrl, docidA, {
        urls: { manifestBase: 'http://manifests-a.example.com/' },
      });
      if (!first.ok) throw new Error('expected first bundle result');

      const second = await SlugClient.FromEndpoint.Timeline.Bundle.load(baseUrl, docidB, {
        urls: { manifestBase: 'http://manifests-b.example.com/' },
      });
      if (!second.ok) throw new Error('expected second bundle result');
      expect(second.value.docid).to.eql(cleanedB);
    } finally {
      cleanup();
    }
  });

  it('resolves hrefs against the provided assetBase', async () => {
    const docid = 'crdt:bundle-basehref' as t.StringId;
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
    const docid = 'crdt:bundle-shard-rewrite-prod' as t.StringId;
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
      composition: [{ src: 'video/main' }] as t.Timecode.Composite.Spec,
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
      if (!result.ok)
        throw new Error(`expected bundle result (${result.error.kind}): ${result.error.message}`);

      const rewritten = result.value.resolveAsset({ kind: 'video', logicalPath: '/video/main' });
      expect(rewritten?.href).to.eql(
        `https://${expectedIndex}.video.cdn.example.com/sample/main.webm`,
      );
    } finally {
      cleanup();
    }
  });

  it('does not rewrite shard host when assetBase host is localhost', async () => {
    const docid = 'crdt:bundle-shard-rewrite-localhost' as t.StringId;
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
      composition: [{ src: 'video/main' }] as t.Timecode.Composite.Spec,
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
    const docid = 'crdt:bundle-shard-rewrite-localhost-root' as t.StringId;
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
      composition: [{ src: 'video/main' }] as t.Timecode.Composite.Spec,
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
    const docid = 'crdt:bundle-shard-rewrite-prod-root' as t.StringId;
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
      composition: [{ src: 'video/main' }] as t.Timecode.Composite.Spec,
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
      if (!result.ok)
        throw new Error(`expected bundle result (${result.error.kind}): ${result.error.message}`);

      const rewritten = result.value.resolveAsset({ kind: 'video', logicalPath: '/video/main' });
      expect(rewritten?.href).to.eql(`https://${expectedIndex}.video.cdn.example.com/main.webm`);
    } finally {
      cleanup();
    }
  });

  it('returns http metadata when manifest fetch fails', async () => {
    const docid = 'crdt:bundle-http' as t.StringId;
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
    const docid = 'crdt:bundle-schema' as t.StringId;
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
    const docid = 'crdt:bundle-docid' as t.StringId;
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
