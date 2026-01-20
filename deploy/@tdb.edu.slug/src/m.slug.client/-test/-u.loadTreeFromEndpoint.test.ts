import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import type { t } from '../common.ts';
import { SlugClient } from '../mod.ts';
import { withStubFetcher } from './u.fixture.ts';

describe('SlugClient: loadTreeFromEndpoint', () => {
  it('preserves inline descriptions through validation', async () => {
    const tree: t.SlugTreeItems = [
      {
        slug: 'Root',
        slugs: [{ slug: 'Child', description: 'Inline description' }],
      },
    ];
    const docid = 'abc' as t.Crdt.Id;
    const expectedDocid = 'abc';

    const baseUrl = 'http://127.0.0.1/';
    const manifestUrl = new URL(`manifests/slug-tree.${expectedDocid}.json`, baseUrl).toString();

    const fetchResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      url: manifestUrl,
      data: tree,
    };

    await withStubFetcher({ expectedUrl: manifestUrl, response: fetchResponse }, async () => {
      const res = await SlugClient.Tree.load(baseUrl, docid);
      expectTypeOf(res).toMatchTypeOf<t.SlugClientResult<t.SlugTreeItems>>();
      expect(res.ok).to.eql(true);
      if (!res.ok) return;
      expect(res.value).to.eql(tree);
      const child = res.value[0]?.slugs?.[0];
      expect(child && 'description' in child ? child.description : undefined).to.eql(
        'Inline description',
      );
    });
  });

  it('cleans uri-like docids before fetching', async () => {
    const tree: t.SlugTreeItems = [{ slug: 'Root' }];
    const docid = '  crdt:docid-cleaned  ' as t.Crdt.Id;
    const expectedDocid = 'docid-cleaned';
    const baseUrl = 'http://127.0.0.1/';
    const manifestUrl = new URL(`manifests/slug-tree.${expectedDocid}.json`, baseUrl).toString();

    const fetchResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      url: manifestUrl,
      data: tree,
    };

    await withStubFetcher({ expectedUrl: manifestUrl, response: fetchResponse }, async () => {
      const res = await SlugClient.Tree.load(baseUrl, docid);
      expect(res.ok).to.eql(true);
      if (!res.ok) return;
      expect(res.value).to.eql(tree);
    });
  });

  it('supports baseUrl with a pathname (no trailing slash)', async () => {
    const tree: t.SlugTreeItems = [{ slug: 'Root' }];
    const docid = 'crdt:0000000' as t.Crdt.Id;
    const expectedDocid = '0000000';

    // This is the repro you described.
    const baseUrl = 'http://localhost:4040/publish.assets';

    // Expected semantics: baseUrl is treated as a "base path" root.
    // → manifest should live under that path.
    const url = new URL(`manifests/slug-tree.${expectedDocid}.json`, `${baseUrl}/`).toString();
    const fetchResponse = { ok: true, status: 200, statusText: 'OK', url, data: tree };

    await withStubFetcher({ expectedUrl: url, response: fetchResponse }, async () => {
      const res = await SlugClient.Tree.load(baseUrl, docid);
      expect(res.ok).to.eql(true);
      if (!res.ok) return;
      expect(res.value).to.eql(tree);
    });
  });

  it('supports baseUrl with a pathname (with trailing slash)', async () => {
    const tree: t.SlugTreeItems = [{ slug: 'Root' }];
    const docid = 'crdt:0000000' as t.Crdt.Id;
    const expectedDocid = '0000000';

    const baseUrl = 'http://localhost:4040/publish.assets/';
    const url = new URL(`manifests/slug-tree.${expectedDocid}.json`, baseUrl).toString();
    const fetchResponse = { ok: true, status: 200, statusText: 'OK', url, data: tree };

    await withStubFetcher({ expectedUrl: url, response: fetchResponse }, async () => {
      const res = await SlugClient.Tree.load(baseUrl, docid);
      expect(res.ok).to.eql(true);
      if (!res.ok) return;
      expect(res.value).to.eql(tree);
    });
  });

  it('throws when manifest fails schema validation', async () => {
    const docid = 'crdt:0000000' as t.Crdt.Id;
    const expectedDocid = '0000000';
    const baseUrl = 'http://127.0.0.1/';
    const url = new URL(`manifests/slug-tree.${expectedDocid}.json`, baseUrl).toString();
    const data = [{ description: 'no slug' }];
    const fetchResponse = { ok: true, status: 200, statusText: 'OK', url, data };

    await withStubFetcher({ expectedUrl: url, response: fetchResponse }, async () => {
      const res = await SlugClient.Tree.load(baseUrl, docid);
      expect(res.ok).to.eql(false);
      if (res.ok) return;
      expect(res.error.kind).to.eql('schema');
      expect(res.error.message).to.include('Slug-tree validation failed');
      expect(res.error.message).to.include('Invalid slug-tree item');
    });
  });

  it('throws when manifest fetch fails (404)', async () => {
    const docid = 'crdt:missing-doc' as t.Crdt.Id;
    const expectedDocid = 'missing-doc';
    const baseUrl = 'http://127.0.0.1/';
    const url = new URL(`manifests/slug-tree.${expectedDocid}.json`, baseUrl).toString();
    const fetchResponse = { ok: false, status: 404, statusText: 'Not Found', url };

    await withStubFetcher({ expectedUrl: url, response: fetchResponse }, async () => {
      const res = await SlugClient.Tree.load(baseUrl, docid);
      expect(res.ok).to.eql(false);
      if (res.ok) return;
      expect(res.error.kind).to.eql('http');
      expect(res.error.status).to.eql(404);
      expect(res.error.url).to.include(`/manifests/slug-tree.${expectedDocid}.json`);
      expect(res.error.statusText).to.be.a('string').and.to.not.be.empty;
    });
  });
});
