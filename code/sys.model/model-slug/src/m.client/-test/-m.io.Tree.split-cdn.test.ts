import { describe, expect, it } from '../../-test.ts';
import { SlugClient } from '../mod.ts';
import type { t } from '../common.ts';
import { jsonResponse, stubFetch } from './u.fixture.ts';

describe('SlugClient.FromEndpoint.Tree.load (split cdn)', () => {
  it('loads manifests from urls.manifestBase', async () => {
    const docid = 'tree-split' as t.StringId;
    const payload: t.SlugTreeDoc = { tree: [{ slug: 'intro', ref: 'slug:intro' }] };
    const seen: string[] = [];
    const cleanup = stubFetch((url) => {
      seen.push(url);
      if (url.includes(SlugClient.Url.treeFilename(docid))) return jsonResponse(payload);
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const result = await SlugClient.FromEndpoint.Tree.load('http://content.example.com/', docid, {
        urls: { manifestBase: 'http://manifests.example.com/' },
      });
      if (!result.ok) throw new Error('expected tree result');
      expect(seen[0]).to.include('http://manifests.example.com');
    } finally {
      cleanup();
    }
  });
});
