import { describe, expect, it } from '../../-test.ts';
import { SlugClient } from '../mod.ts';

import type { t } from '../common.ts';
import { D } from '../common.ts';
import { jsonResponse, stubFetch, textResponse } from './u.fixture.ts';

describe('SlugClient.FromEndpoint.FileContent', () => {
  const FileContent = SlugClient.FromEndpoint.FileContent;

  it('loads slug-file-content index (happy path)', async () => {
    const docid = 'crdt:file-index' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);
    const index: t.SlugFileContentIndex = {
      docid: cleaned,
      entries: [
        {
          hash: 'sha256-abc',
          contentType: 'text/markdown',
          frontmatter: { ref: 'crdt:one', title: 'One' },
          path: 'one.md',
        },
      ],
    };
    const seenUrls: string[] = [];
    const cleanup = stubFetch((url) => {
      seenUrls.push(url);
      if (url.includes(SlugClient.Url.treeAssetsFilename(cleaned))) return jsonResponse(index);
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await FileContent.index('http://example.com/', docid);
      if (!result.ok) throw new Error('expected index result');
      expect(result.value).to.eql(index);
      expect(seenUrls[0]).to.include('/-manifests/');
      expect(seenUrls[0]).to.include(SlugClient.Url.treeAssetsFilename(cleaned));
    } finally {
      cleanup();
    }
  });

  it('loads slug-file-content payload (happy path)', async () => {
    const hash = 'sha256-hash';
    const payload: t.SlugFileContentDoc = {
      hash,
      contentType: 'text/markdown',
      frontmatter: { ref: 'crdt:doc' },
      source: 'Hello',
    };
    const seenUrls: string[] = [];
    const cleanup = stubFetch((url) => {
      seenUrls.push(url);
      if (url.includes(SlugClient.Url.fileContentFilename(hash))) return jsonResponse(payload);
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await FileContent.get('http://example.com/', hash);
      if (!result.ok) throw new Error('expected payload result');
      expect(result.value).to.eql(payload);
      expect(seenUrls[0]).to.include('/content/');
    } finally {
      cleanup();
    }
  });

  it('passes RequestInit extras but enforces cache policy', async () => {
    const docid = 'crdt:file-init' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);
    const index: t.SlugFileContentIndex = { docid: cleaned, entries: [] };
    let seenInit: RequestInit | undefined;
    const cleanup = stubFetch((url, init) => {
      if (url.includes(SlugClient.Url.treeAssetsFilename(cleaned))) {
        seenInit = init;
        return jsonResponse(index);
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const init: RequestInit = {
        method: 'POST',
        headers: { 'x-file': '1' },
        cache: 'force-cache',
      };
      const result = await FileContent.index('http://example.com/', docid, { init });
      if (!result.ok) throw new Error('expected index result');
      const headers = seenInit?.headers;
      const headerValue =
        headers instanceof Headers
          ? headers.get('x-file')
          : headers && typeof headers === 'object' && !Array.isArray(headers)
            ? (headers as Record<string, string>)['x-file']
            : undefined;
      expect(seenInit?.method).to.equal('POST');
      expect(headerValue).to.eql('1');
      expect(seenInit?.cache).to.eql(D.CACHE_INIT.cache);
    } finally {
      cleanup();
    }
  });

  it('returns http metadata when fetch fails', async () => {
    const docid = 'crdt:file-http' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);
    const cleanup = stubFetch((url) => {
      if (url.includes(SlugClient.Url.treeAssetsFilename(cleaned)))
        return textResponse('Not Found', { status: 404, statusText: 'Not Found' });
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await FileContent.index('http://example.com/', docid);
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected http failure');
      expect(result.error.kind).to.equal('http');
      if (result.error.kind !== 'http') throw new Error('expected http error');
      expect(result.error.status).to.equal(404);
      expect(result.error.url).to.include(SlugClient.Url.treeAssetsFilename(cleaned));
    } finally {
      cleanup();
    }
  });

  it('returns schema info when index is invalid', async () => {
    const docid = 'crdt:file-schema' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);
    const cleanup = stubFetch((url) => {
      if (url.includes(SlugClient.Url.treeAssetsFilename(cleaned)))
        return jsonResponse({ docid: cleaned });
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await FileContent.index('http://example.com/', docid);
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected schema error');
      expect(result.error.kind).to.equal('schema');
      if (result.error.kind !== 'schema') throw new Error('expected schema failure');
      expect(result.error.message).to.include('Slug-file-content index failed');
    } finally {
      cleanup();
    }
  });

  it('reports schema errors when docids do not match', async () => {
    const docid = 'crdt:file-mismatch' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);
    const cleanup = stubFetch((url) => {
      if (url.includes(SlugClient.Url.treeAssetsFilename(cleaned)))
        return jsonResponse({
          docid: 'other-doc',
          entries: [],
        });
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await FileContent.index('http://example.com/', docid);
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

  it('supports layout overrides for manifests/content dirs', async () => {
    const docid = 'crdt:file-layout' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);
    const hash = 'sha256-layout';
    const index: t.SlugFileContentIndex = { docid: cleaned, entries: [] };
    const payload: t.SlugFileContentDoc = {
      hash,
      contentType: 'text/markdown',
      frontmatter: { ref: 'crdt:doc' },
      source: 'Layout',
    };
    const seenUrls: string[] = [];
    const cleanup = stubFetch((url) => {
      seenUrls.push(url);
      if (url.includes(`/custom-manifests/${SlugClient.Url.treeAssetsFilename(cleaned)}`)) {
        return jsonResponse(index);
      }
      if (url.includes(`/content/${SlugClient.Url.fileContentFilename(hash)}`)) {
        return jsonResponse(payload);
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const layout = { manifestsDir: 'custom-manifests', contentDir: 'content' };
      const indexResult = await FileContent.index('http://example.com/', docid, { layout });
      if (!indexResult.ok) throw new Error('expected index result');
      const payloadResult = await FileContent.get('http://example.com/', hash, { layout });
      if (!payloadResult.ok) throw new Error('expected payload result');
      expect(seenUrls.some((url) => url.includes('/custom-manifests/'))).to.eql(true);
      expect(seenUrls.some((url) => url.includes('/content/'))).to.eql(true);
    } finally {
      cleanup();
    }
  });
});
