import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import type { t } from '../common.ts';
import { Http } from '../common.ts';
import { SlugClient } from '../mod.ts';

const withStubFetcher = async (
  args: {
    readonly expectedUrl: string;
    readonly response: unknown;
  },
  fn: () => Promise<void>,
) => {
  const originalFetcher = Http.fetcher;

  const stubFetcher = {
    json: async (url: string) => {
      expect(url).to.eql(args.expectedUrl);
      return args.response;
    },
  };

  (Http as any).fetcher = () => stubFetcher as never;
  try {
    await fn();
  } finally {
    (Http as any).fetcher = originalFetcher;
  }
};

describe('SlugClient: loadTreeFromEndpoint', () => {
  it('preserves inline descriptions through validation', async () => {
    const tree: t.SlugTreeProps = [
      {
        slug: 'Root',
        slugs: [{ slug: 'Child', description: 'Inline description' }],
      },
    ];
    const docid = 'crdt:slug-tree' as t.Crdt.Id;

    const baseUrl = 'http://127.0.0.1/';
    const manifestUrl = new URL(`manifests/slug-tree.${docid}.json`, baseUrl).toString();

    const fetchResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      url: manifestUrl,
      data: tree,
    };

    await withStubFetcher({ expectedUrl: manifestUrl, response: fetchResponse }, async () => {
      const res = await SlugClient.loadTreeFromEndpoint(baseUrl, docid);
      expectTypeOf(res).toMatchTypeOf<t.SlugClientResult<t.SlugTreeProps>>();
      expect(res.ok).to.eql(true);
      if (!res.ok) return;
      expect(res.value).to.eql(tree);
      const child = res.value[0]?.slugs?.[0];
      expect(child && 'description' in child ? child.description : undefined).to.eql(
        'Inline description',
      );
    });
  });

  it('supports baseUrl with a pathname (no trailing slash)', async () => {
    const tree: t.SlugTreeProps = [{ slug: 'Root' }];
    const docid = 'crdt:slug-tree-path' as t.Crdt.Id;

    // This is the repro you described.
    const baseUrl = 'http://localhost:4040/publish.assets';

    // Expected semantics: baseUrl is treated as a "base path" root.
    // → manifest should live under that path.
    const manifestUrl = new URL(`manifests/slug-tree.${docid}.json`, `${baseUrl}/`).toString();

    const fetchResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      url: manifestUrl,
      data: tree,
    };

    await withStubFetcher({ expectedUrl: manifestUrl, response: fetchResponse }, async () => {
      const res = await SlugClient.loadTreeFromEndpoint(baseUrl, docid);
      expect(res.ok).to.eql(true);
      if (!res.ok) return;
      expect(res.value).to.eql(tree);
    });
  });

  it('supports baseUrl with a pathname (with trailing slash)', async () => {
    const tree: t.SlugTreeProps = [{ slug: 'Root' }];
    const docid = 'crdt:slug-tree-path-slash' as t.Crdt.Id;

    const baseUrl = 'http://localhost:4040/publish.assets/';
    const manifestUrl = new URL(`manifests/slug-tree.${docid}.json`, baseUrl).toString();

    const fetchResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      url: manifestUrl,
      data: tree,
    };

    await withStubFetcher({ expectedUrl: manifestUrl, response: fetchResponse }, async () => {
      const res = await SlugClient.loadTreeFromEndpoint(baseUrl, docid);
      expect(res.ok).to.eql(true);
      if (!res.ok) return;
      expect(res.value).to.eql(tree);
    });
  });

  it('throws when manifest fails schema validation', async () => {
    const docid = 'crdt:slug-tree-schema' as t.Crdt.Id;
    const baseUrl = 'http://127.0.0.1/';
    const manifestUrl = new URL(`manifests/slug-tree.${docid}.json`, baseUrl).toString();

    const fetchResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      url: manifestUrl,
      data: [{ description: 'no slug' }],
    };

    await withStubFetcher({ expectedUrl: manifestUrl, response: fetchResponse }, async () => {
      const res = await SlugClient.loadTreeFromEndpoint(baseUrl, docid);
      expect(res.ok).to.eql(false);
      if (res.ok) return;
      expect(res.error.kind).to.eql('schema');
      expect(res.error.message).to.include('Slug-tree validation failed');
      expect(res.error.message).to.include('Invalid slug-tree item');
    });
  });

  it('throws when manifest fetch fails (404)', async () => {
    const docid = 'crdt:missing-doc' as t.Crdt.Id;
    const baseUrl = 'http://127.0.0.1/';
    const manifestUrl = new URL(`manifests/slug-tree.${docid}.json`, baseUrl).toString();

    const fetchResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      url: manifestUrl,
    };

    await withStubFetcher({ expectedUrl: manifestUrl, response: fetchResponse }, async () => {
      const res = await SlugClient.loadTreeFromEndpoint(baseUrl, docid);
      expect(res.ok).to.eql(false);
      if (res.ok) return;
      expect(res.error.kind).to.eql('http');
      expect(res.error.status).to.eql(404);
      expect(res.error.url).to.include(`/manifests/slug-tree.${docid}.json`);
      expect(res.error.statusText).to.be.a('string').and.to.not.be.empty;
    });
  });
});
