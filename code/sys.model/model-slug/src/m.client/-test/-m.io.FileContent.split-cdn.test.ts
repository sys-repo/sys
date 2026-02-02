import { describe, expect, it } from '../../-test.ts';
import type { t } from '../common.ts';
import { SlugClient } from '../mod.ts';
import { jsonResponse, stubFetch } from './u.fixture.ts';

describe('SlugClient.FromEndpoint.FileContent (split cdn)', () => {
  it('uses manifestsBaseUrl for index and contentBaseUrl for content', async () => {
    const docid = 'crdt:file-split' as t.StringId;
    const cleaned = SlugClient.Url.clean(docid);
    const index: t.SlugFileContentIndex = {
      docid: cleaned,
      entries: [{ hash: 'hash-a', contentType: 'text/plain', frontmatter: { ref: 'crdt:a' } }],
    };
    const payload: t.SlugFileContentDoc = {
      source: 'hello',
      hash: 'hash-a',
      contentType: 'text/plain',
      frontmatter: { ref: 'crdt:a' },
    };

    const seen: string[] = [];
    const cleanup = stubFetch((url) => {
      seen.push(url);
      if (url.includes(SlugClient.Url.treeAssetsFilename(cleaned))) return jsonResponse(index);
      if (url.includes(SlugClient.Url.fileContentFilename('hash-a'))) return jsonResponse(payload);
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const options = {
        manifestsBaseUrl: 'http://manifests.example.com/',
        contentBaseUrl: 'http://content.example.com/',
      };

      const indexResult = await SlugClient.FromEndpoint.FileContent.index(
        'http://base.example.com/',
        docid,
        options,
      );
      if (!indexResult.ok) throw new Error('expected index result');

      const docResult = await SlugClient.FromEndpoint.FileContent.get(
        'http://base.example.com/',
        'hash-a',
        options,
      );
      if (!docResult.ok) throw new Error('expected doc result');

      expect(seen.some((url) => url.includes('http://manifests.example.com'))).to.eql(true);
      expect(seen.some((url) => url.includes('http://content.example.com'))).to.eql(true);
    } finally {
      cleanup();
    }
  });
});
