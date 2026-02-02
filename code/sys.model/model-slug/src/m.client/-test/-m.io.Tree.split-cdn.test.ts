import { describe, expect, it } from '../../-test.ts';
import { SlugClient } from '../mod.ts';
import type { t } from '../common.ts';
import { jsonResponse, stubFetch } from './u.fixture.ts';

describe('SlugClient.FromEndpoint.Tree.load (split cdn)', () => {
  it('loads manifests from manifestsBaseUrl', async () => {
    const docid = 'crdt:tree-split' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);
    const payload: t.SlugTreeDoc = { tree: [{ slug: 'intro', ref: 'slug:intro' }] };
    const seen: string[] = [];
    const cleanup = stubFetch((url) => {
      seen.push(url);
      if (url.includes(SlugClient.Url.treeFilename(cleaned))) return jsonResponse(payload);
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await SlugClient.FromEndpoint.Tree.load('http://content.example.com/', docid, {
        manifestsBaseUrl: 'http://manifests.example.com/',
      });
      if (!result.ok) throw new Error('expected tree result');
      expect(seen[0]).to.include('http://manifests.example.com');
    } finally {
      cleanup();
    }
  });
});
