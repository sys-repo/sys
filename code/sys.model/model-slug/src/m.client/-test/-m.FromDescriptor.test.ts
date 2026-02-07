import { describe, expect, it } from '../../-test.ts';
import { SlugClient } from '../mod.ts';
import type { t } from '../common.ts';
import { jsonResponse, stubFetch } from './u.fixture.ts';

describe('SlugClient.FromDescriptor', () => {
  it('selects one bundle by kind/docid', () => {
    const descriptor: t.BundleDescriptorDoc = {
      bundles: [
        {
          kind: 'slug-tree:fs',
          version: 1,
          docid: 'kb',
        },
        {
          kind: 'slug-tree:media:seq',
          version: 1,
          docid: 'program-docid',
        },
      ],
    };

    const result = SlugClient.FromDescriptor.select({
      descriptor,
      kind: 'slug-tree:media:seq',
      docid: 'program-docid',
    });

    expect(result.ok).to.eql(true);
    if (!result.ok) return;
    expect(result.value.kind).to.eql('slug-tree:media:seq');
    expect(result.value.docid).to.eql('program-docid');
  });

  it('binds baseUrl, basePath, docid, and layout', async () => {
    const descriptor: t.BundleDescriptorDoc = {
      bundles: [
        {
          kind: 'slug-tree:fs',
          version: 1,
          docid: 'crdt:bundle-1',
          basePath: '/root',
          layout: {
            manifestsDir: 'manifests-x',
            contentDir: 'content-x',
          },
        },
      ],
    };

    const result = SlugClient.FromDescriptor.make({
      descriptor,
      baseUrl: 'http://example.com/',
    });

    if (!result.ok) throw new Error('expected descriptor to resolve');
    const client = result.value;

    const cleaned = SlugClient.Url.clean(client.docid);
    const seenUrls: string[] = [];
    const payload: t.SlugTreeDoc = { tree: [{ slug: 'intro', ref: 'slug:intro' }] };
    const cleanup = stubFetch((url) => {
      seenUrls.push(url);
      if (url.includes(SlugClient.Url.treeFilename(cleaned))) return jsonResponse(payload);
      throw new Error(`Unexpected fetch: ${url}`);
    });

    try {
      const tree = await client.Tree.load();
      if (!tree.ok) throw new Error('expected tree load success');
      expect(seenUrls[0]).to.include('/root/');
      expect(seenUrls[0]).to.include('/manifests-x/');
      expect(seenUrls[0]).to.include(SlugClient.Url.treeFilename(cleaned));
    } finally {
      cleanup();
    }
  });

  it('rejects ambiguous bundle selections', async () => {
    const descriptor: t.BundleDescriptorDoc = {
      bundles: [
        {
          kind: 'slug-tree:fs',
          version: 1,
          docid: 'slug:one',
        },
        {
          kind: 'slug-tree:media:seq',
          version: 1,
          docid: 'slug:two',
        },
      ],
    };

    const result = SlugClient.FromDescriptor.make({
      descriptor,
      baseUrl: 'http://example.com/',
    });

    expect(result.ok).to.eql(false);
    if (result.ok) return;
    expect(result.error.kind).to.eql('schema');
  });
});
