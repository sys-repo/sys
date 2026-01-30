import { describe, expect, it } from '../../-test.ts';
import { SlugClient } from '../mod.ts';

import type { t } from '../common.ts';
import { D } from '../common.ts';
import { jsonResponse, stubFetch, textResponse } from './u.fixture.ts';

describe('SlugClient.FromEndpoint.Tree.load', () => {
  const Tree = SlugClient.FromEndpoint.Tree;

  it('is the SlugClient tree loader', () => {
    expect(SlugClient.FromEndpoint.Tree).to.equal(Tree);
  });

  it('loads tree manifest (happy path)', async () => {
    const docid = 'crdt:tree-happy' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);
    const payload: t.SlugTreeDoc = {
      tree: [
        { slug: 'intro', ref: 'slug:intro' },
        { slug: 'chapter', ref: 'slug:chapter' },
      ],
    };
    const seenUrls: string[] = [];
    const cleanup = stubFetch((url) => {
      seenUrls.push(url);
      if (url.includes(SlugClient.Url.treeFilename(cleaned))) return jsonResponse(payload);
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await Tree.load('http://example.com/', docid);
      if (!result.ok) throw new Error('expected tree result');
      expect(result.value).to.eql(payload);
      expect(seenUrls[0]).to.include('/manifests/');
      expect(seenUrls[0]).to.include(SlugClient.Url.treeFilename(cleaned));
    } finally {
      cleanup();
    }
  });

  it('passes RequestInit extras but enforces cache policy', async () => {
    const docid = 'crdt:tree-init' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);
    const payload: t.SlugTreeDoc = { tree: [{ slug: 'one', ref: 'slug:one' }] };
    let seenInit: RequestInit | undefined;
    const cleanup = stubFetch((url, init) => {
      if (url.includes(SlugClient.Url.treeFilename(cleaned))) {
        seenInit = init;
        return jsonResponse(payload);
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const init: RequestInit = {
        method: 'PATCH',
        headers: { 'x-tree': '1' },
        cache: 'reload',
      };
      if (!(await Tree.load('http://example.com/', docid, { init })).ok) {
        throw new Error('expected tree load success');
      }
      const headers = seenInit?.headers;
      const headerValue =
        headers instanceof Headers
          ? headers.get('x-tree')
          : headers && typeof headers === 'object' && !Array.isArray(headers)
            ? (headers as Record<string, string>)['x-tree']
            : undefined;
      expect(seenInit?.method).to.equal('PATCH');
      expect(headerValue).to.eql('1');
      expect(seenInit?.cache).to.eql(D.CACHE_INIT.cache);
    } finally {
      cleanup();
    }
  });

  it('returns http metadata when fetch fails', async () => {
    const docid = 'crdt:tree-http' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);
    const cleanup = stubFetch((url) => {
      if (url.includes(SlugClient.Url.treeFilename(cleaned)))
        return textResponse('Service Unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await Tree.load('http://example.com/', docid);
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected http failure');
      expect(result.error.kind).to.equal('http');
      if (result.error.kind !== 'http') throw new Error('expected http error');
      expect(result.error.status).to.equal(503);
      expect(result.error.message).to.include('Slug-tree manifest fetch failed');
      expect(result.error.message).to.include('503');
      expect(result.error.url).to.include(SlugClient.Url.treeFilename(cleaned));
    } finally {
      cleanup();
    }
  });

  it('returns schema info when manifest validation fails', async () => {
    const docid = 'crdt:tree-schema' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);
    const cleanup = stubFetch((url) => {
      if (url.includes(SlugClient.Url.treeFilename(cleaned))) {
        return jsonResponse({ tree: [{ slug: 123 }] });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await Tree.load('http://example.com/', docid);
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected schema error');
      expect(result.error.kind).to.equal('schema');
      if (result.error.kind !== 'schema') throw new Error('expected schema failure');
      expect(result.error.message).to.include('Slug-tree validation failed');
    } finally {
      cleanup();
    }
  });
});
