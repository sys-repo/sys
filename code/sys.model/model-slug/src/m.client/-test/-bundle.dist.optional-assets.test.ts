import { describe, expect, it } from '../../-test.ts';
import { SlugClient } from '../mod.ts';
import { Dist } from '../u.io.Dist.ts';

import type { t } from '../common.ts';
import { jsonResponse, stubFetch } from './u.fixture.ts';

const baseUrl = 'http://example.com/';

const makeDist = (parts: string[]): t.DistPkg => {
  const hashParts: Record<string, t.StringFileHashUri> = {};
  for (const part of parts) {
    hashParts[part] =
      'sha256-dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd:size=0';
  }

  return {
    type: 'https://example.com/src/types/t.Pkg.dist.ts',
    pkg: { name: 'slug-client', version: '0.0.2' },
    build: {
      time: 0 as t.UnixTimestamp,
      size: { total: 0, pkg: 0 },
      builder: 'slug-client@0.0.2',
      runtime: 'deno=1:v8=1:typescript=5',
      hash: { policy: 'https://jsr.io/@sys/fs/0.0.225/src/m.Pkg/m.Pkg.Dist.ts' },
    },
    hash: {
      digest: 'sha256-eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      parts: hashParts as t.CompositeHashParts,
    },
  };
};

describe('SlugClient.FromEndpoint.Timeline.Bundle.load (dist gating)', () => {
  it('skips assets when dist lacks assets entry', async () => {
    const docid = 'crdt:dist-only-playback' as t.StringId;
    const cleaned = SlugClient.Url.Util.cleanDocid(docid);
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

    const dist = makeDist([SlugClient.Url.playbackFilename(cleaned)]);
    Dist.invalidate(baseUrl);
    const cleanup = stubFetch((url) => {
      if (url.includes('manifests/dist.json')) return jsonResponse(dist);
      if (url.includes(SlugClient.Url.playbackFilename(cleaned))) {
        return jsonResponse(playback);
      }
      if (url.includes(SlugClient.Url.assetsFilename(cleaned))) {
        throw new Error('assets manifest should not be fetched');
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await SlugClient.FromEndpoint.Timeline.Bundle.load(baseUrl, docid);
      if (!result.ok) throw new Error('expected bundle result');
      const bundle = result.value;
      expect(bundle.resolveAsset({ kind: 'video', logicalPath: '/video/main' })).to.eql(undefined);
    } finally {
      cleanup();
    }
  });

  it('fetches assets when dist includes an assets entry', async () => {
    const docid = 'crdt:dist-with-assets' as t.StringId;
    const cleaned = SlugClient.Url.Util.cleanDocid(docid);

    const assets: t.SpecTimelineAssetsManifest = {
      docid: cleaned,
      assets: [
        {
          kind: 'image',
          logicalPath: 'image/spot',
          hash: 'hash-image',
          filename: 'spot.png',
          href: 'spot.png',
          stats: { bytes: 42 },
        },
      ],
    };

    const playback: t.SpecTimelineManifest = {
      docid: cleaned,
      composition: [{ src: 'video/main' }] as t.Timecode.Composite.Spec,
      beats: [
        {
          src: { kind: 'image', logicalPath: 'image/spot', time: 0 as t.Msecs },
          payload: null,
        },
      ],
    };

    const dist = makeDist([
      SlugClient.Url.assetsFilename(cleaned),
      SlugClient.Url.playbackFilename(cleaned),
    ]);
    let assetsRequested = false;

    Dist.invalidate(baseUrl);
    const cleanup = stubFetch((url) => {
      if (url.includes('manifests/dist.json')) return jsonResponse(dist);
      if (url.includes(SlugClient.Url.assetsFilename(cleaned))) {
        assetsRequested = true;
        return jsonResponse(assets);
      }
      if (url.includes(SlugClient.Url.playbackFilename(cleaned))) {
        return jsonResponse(playback);
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await SlugClient.FromEndpoint.Timeline.Bundle.load(baseUrl, docid);
      if (!result.ok) throw new Error('expected bundle');
      expect(assetsRequested).to.eql(true);
    } finally {
      cleanup();
    }
  });

  it('fails fast when dist omits playback entry', async () => {
    const docid = 'crdt:dist-missing-playback' as t.StringId;
    const cleaned = SlugClient.Url.Util.cleanDocid(docid);
    const dist = makeDist([SlugClient.Url.assetsFilename(cleaned)]);

    Dist.invalidate(baseUrl);
    const cleanup = stubFetch((url) => {
      if (url.includes('manifests/dist.json')) return jsonResponse(dist);
      if (url.includes(SlugClient.Url.assetsFilename(cleaned))) {
        return jsonResponse({ docid: cleaned, assets: [] } as t.SpecTimelineAssetsManifest);
      }
      if (url.includes(SlugClient.Url.playbackFilename(cleaned))) {
        throw new Error('playback manifest must not be fetched');
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await SlugClient.FromEndpoint.Timeline.Bundle.load(baseUrl, docid);
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected schema failure');
      expect(result.error.kind).to.eql('schema');
      expect(result.error.message).to.include('Playback manifest not present in dist.json');
    } finally {
      cleanup();
    }
  });

  it('fails when dist parts use manifests/ prefix (invalid key-space)', async () => {
    const docid = 'crdt:dist-bare-keys' as t.StringId;
    const cleaned = SlugClient.Url.Util.cleanDocid(docid);

    const playback: t.SpecTimelineManifest = {
      docid: cleaned,
      composition: [{ src: 'video/main' }] as t.Timecode.Composite.Spec,
      beats: [
        {
          src: { kind: 'video', logicalPath: '/video/main', time: 0 as t.Msecs },
          payload: null,
        },
      ],
    };

    const dist = makeDist([`manifests/${SlugClient.Url.playbackFilename(cleaned)}`]);
    Dist.invalidate(baseUrl);

    const cleanup = stubFetch((url) => {
      if (url.includes('manifests/dist.json')) return jsonResponse(dist);
      if (url.includes(SlugClient.Url.playbackFilename(cleaned))) {
        throw new Error('playback manifest must not be fetched');
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await SlugClient.FromEndpoint.Timeline.Bundle.load(baseUrl, docid);
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected schema failure');
      expect(result.error.kind).to.eql('schema');
      expect(result.error.message).to.include('Playback manifest not present in dist.json');
    } finally {
      cleanup();
    }
  });
});
