import { describe, expect, it } from '../../-test.ts';
import { SlugClient } from '../mod.ts';

import type { t } from '../common.ts';
import { jsonResponse, stubFetch, textResponse } from './u.fixture.ts';

describe('SlugClient.FromEndpoint.Descriptor.load', () => {
  const Descriptor = SlugClient.FromEndpoint.Descriptor;

  it('loads dist.client.json (happy path)', async () => {
    const payload: t.BundleDescriptorDoc = {
      bundles: [
        {
          kind: 'slug-tree:fs',
          version: 1,
          docid: 'slug:doc-fs',
          basePath: '/slug-doc',
          layout: {
            manifestsDir: 'manifests',
            contentDir: 'content',
          },
          files: {
            tree: 'tree.json',
            index: 'index.json',
          },
        },
      ],
    };
    const seenUrls: string[] = [];
    const cleanup = stubFetch((url) => {
      seenUrls.push(url);
      if (url.includes('dist.client.json')) return jsonResponse(payload);
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await Descriptor.load('http://example.com/', 'publish.assets');
      if (!result.ok) throw new Error('expected descriptor result');
      expect(result.value).to.eql(payload);
      expect(seenUrls[0]).to.include('/publish.assets/');
      expect(seenUrls[0]).to.include('dist.client.json');
    } finally {
      cleanup();
    }
  });

  it('returns http metadata when fetch fails', async () => {
    const cleanup = stubFetch((url) => {
      if (url.includes('dist.client.json')) {
        return textResponse('Not Found', { status: 404, statusText: 'Not Found' });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await Descriptor.load('http://example.com/', 'publish.assets');
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected http failure');
      expect(result.error.kind).to.equal('http');
      if (result.error.kind !== 'http') throw new Error('expected http error');
      expect(result.error.status).to.equal(404);
      expect(result.error.message).to.include('dist.client.json fetch failed');
      expect(result.error.url).to.include('dist.client.json');
    } finally {
      cleanup();
    }
  });

  it('returns schema info when descriptor validation fails', async () => {
    const cleanup = stubFetch((url) => {
      if (url.includes('dist.client.json')) {
        return jsonResponse({ bundles: [{ kind: 'slug-tree:fs' }] });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await Descriptor.load('http://example.com/', 'publish.assets');
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected schema error');
      expect(result.error.kind).to.equal('schema');
      if (result.error.kind !== 'schema') throw new Error('expected schema failure');
      expect(result.error.message).to.include('dist.client.json failed @sys/schema validation');
    } finally {
      cleanup();
    }
  });
});
