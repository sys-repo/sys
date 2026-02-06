import { describe, expect, it } from '../../-test.ts';
import { Assets } from '../m.io.timeline.Assets.ts';
import { SlugClient } from '../mod.ts';

import type { t } from '../common.ts';
import { D } from '../common.ts';
import { jsonResponse, stubFetch, textResponse } from './u.fixture.ts';

describe('SlugClient.FromEndpoint.Timeline.Assets.load', () => {
  it('is the SlugClient asset loader', () => {
    expect(SlugClient.FromEndpoint.Timeline.Assets).to.equal(Assets);
  });

  it('loads assets manifest (happy path)', async () => {
    const docid = 'crdt:assets-happy' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);
    const manifest: t.SpecTimelineAssetsManifest = {
      docid: cleaned,
      assets: [
        {
          kind: 'image',
          logicalPath: 'image/one',
          hash: 'hash-one',
          filename: 'one.png',
          href: '/image/one.png',
          stats: { bytes: 24 },
        },
      ],
    };
    const seenUrls: string[] = [];
    const cleanup = stubFetch((url) => {
      seenUrls.push(url);
      if (url.includes(SlugClient.Url.assetsFilename(cleaned))) return jsonResponse(manifest);
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await Assets.load('http://example.com/', docid);
      if (!result.ok) throw new Error('expected assets result');
      expect(result.ok).to.eql(true);
      expect(result.value).to.eql(manifest);
      expect(seenUrls[0]).to.include('/-manifests/');
      expect(seenUrls[0]).to.include(SlugClient.Url.assetsFilename(cleaned));
    } finally {
      cleanup();
    }
  });

  it('loads manifests from urls.manifestBase', async () => {
    const docid = 'crdt:assets-split' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);
    const manifest: t.SpecTimelineAssetsManifest = { docid: cleaned, assets: [] };
    const seen: string[] = [];
    const cleanup = stubFetch((url) => {
      seen.push(url);
      if (url.includes(SlugClient.Url.assetsFilename(cleaned))) return jsonResponse(manifest);
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await Assets.load('http://content.example.com/', docid, {
        urls: { manifestBase: 'http://manifests.example.com/' },
      });
      if (!result.ok) throw new Error('expected assets result');
      expect(seen[0]).to.include('http://manifests.example.com');
    } finally {
      cleanup();
    }
  });

  it('passes RequestInit extras but enforces cache policy', async () => {
    const docid = 'crdt:assets-init' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);
    const manifest: t.SpecTimelineAssetsManifest = {
      docid: cleaned,
      assets: [],
    };
    let seenInit: RequestInit | undefined;
    const cleanup = stubFetch((url, init) => {
      if (url.includes(SlugClient.Url.assetsFilename(cleaned))) {
        seenInit = init;
        return jsonResponse(manifest);
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const init: RequestInit = {
        method: 'POST',
        headers: { 'x-test': '1' },
        cache: 'force-cache',
      };
      const result = await Assets.load('http://example.com/', docid, { init });
      if (!result.ok) throw new Error('expected assets result');
      const headers = seenInit?.headers;
      const headerValue =
        headers instanceof Headers
          ? headers.get('x-test')
          : headers && typeof headers === 'object' && !Array.isArray(headers)
            ? (headers as Record<string, string>)['x-test']
            : undefined;
      expect(seenInit?.method).to.equal('POST');
      expect(headerValue).to.eql('1');
      expect(seenInit?.cache).to.eql(D.CACHE_INIT.cache);
    } finally {
      cleanup();
    }
  });

  it('returns http metadata when fetch fails', async () => {
    const docid = 'crdt:assets-http' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);
    const cleanup = stubFetch((url) => {
      if (url.includes(SlugClient.Url.assetsFilename(cleaned)))
        return textResponse('Service Unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await Assets.load('http://example.com/', docid);
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected http error');
      expect(result.error.kind).to.equal('http');
      if (result.error.kind !== 'http') throw new Error('expected http failure');
      expect(result.error.status).to.equal(503);
      expect(result.error.url).to.include(SlugClient.Url.assetsFilename(cleaned));
    } finally {
      cleanup();
    }
  });

  it('returns http metadata when manifest is missing', async () => {
    const docid = 'crdt:assets-missing' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);
    const cleanup = stubFetch((url) => {
      if (url.includes(SlugClient.Url.assetsFilename(cleaned)))
        return textResponse('Not Found', { status: 404, statusText: 'Not Found' });
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await Assets.load('http://example.com/', docid);
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected http error');
      expect(result.error.kind).to.equal('http');
      if (result.error.kind !== 'http') throw new Error('expected http failure');
      expect(result.error.status).to.equal(404);
      expect(result.error.message).to.include('Assets manifest missing despite dist.json entry.');
    } finally {
      cleanup();
    }
  });

  it('returns schema info when manifest is invalid', async () => {
    const docid = 'crdt:assets-schema' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);
    const cleanup = stubFetch((url) => {
      if (url.includes(SlugClient.Url.assetsFilename(cleaned)))
        return jsonResponse({ docid: cleaned });
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await Assets.load('http://example.com/', docid);
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected schema error');
      expect(result.error.kind).to.equal('schema');
      if (result.error.kind !== 'schema') throw new Error('expected schema failure');
      expect(result.error.message).to.include('Assets manifest failed');
    } finally {
      cleanup();
    }
  });

  it('reports schema errors when docids do not match', async () => {
    const docid = 'crdt:assets-mismatch' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);
    const cleanup = stubFetch((url) => {
      if (url.includes(SlugClient.Url.assetsFilename(cleaned)))
        return jsonResponse({
          docid: 'other-doc',
          assets: [],
        });
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await Assets.load('http://example.com/', docid);
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected schema mismatch');
      expect(result.error.kind).to.equal('schema');
      if (result.error.kind !== 'schema') throw new Error('expected schema mismatch');
      expect(result.error.message).to.include('docid mismatch');
      expect(result.error.message).to.include(cleaned);
      expect(result.error.message).to.include('other-doc');
    } finally {
      cleanup();
    }
  });
});
