import { describe, expect, it } from '../../-test.ts';
import type { t } from '../common.ts';
import { SlugClient } from '../mod.ts';

describe('SlugClient: loadSlugTreeFromEndpoint', () => {
  it('preserves inline descriptions through validation', async () => {
    const tree: t.SlugTreeProps = [
      {
        slug: 'Root',
        slugs: [
          {
            slug: 'Child',
            description: 'Inline description',
          },
        ],
      },
    ];
    const docid = 'crdt:slug-tree' as t.Crdt.Id;

    const handler: Deno.ServeHandler = (req) => {
      const { pathname } = new URL(req.url);
      if (pathname === `/manifests/slug-tree.${docid}.json`) {
        return new Response(JSON.stringify(tree), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response('missing', { status: 404 });
    };

    const server = Deno.serve({ port: 0 }, handler);
    try {
      const baseUrl = baseUrlFrom(server);
      const res = await SlugClient.loadSlugTreeFromEndpoint(baseUrl, docid);
      expect(res).to.eql(tree);
      const child = res[0]?.slugs?.[0];
      expect(child && 'description' in child ? child.description : undefined).to.eql(
        'Inline description',
      );
    } finally {
      await server.shutdown();
    }
  });

  it('throws when manifest fails schema validation', async () => {
    const docid = 'crdt:slug-tree-schema' as t.Crdt.Id;
    const handler: Deno.ServeHandler = (req) => {
      const { pathname } = new URL(req.url);
      if (pathname === `/manifests/slug-tree.${docid}.json`) {
        return new Response(JSON.stringify([{ description: 'no slug' }]), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response('missing', { status: 404 });
    };

    const server = Deno.serve({ port: 0 }, handler);
    try {
      const baseUrl = baseUrlFrom(server);
      let err: unknown;
      try {
        await SlugClient.loadSlugTreeFromEndpoint(baseUrl, docid);
      } catch (e) {
        err = e;
      }
      expect(err).to.be.instanceOf(Error);
      expect(String(err)).to.include('Slug-tree validation failed');
    } finally {
      await server.shutdown();
    }
  });

  it('throws when manifest fetch fails (404)', async () => {
    const docid = 'crdt:missing-doc' as t.Crdt.Id;
    const server = Deno.serve({ port: 0 }, () => new Response('missing', { status: 404 }));

    try {
      const baseUrl = baseUrlFrom(server);
      let err: unknown;
      try {
        await SlugClient.loadSlugTreeFromEndpoint(baseUrl, docid);
      } catch (e) {
        err = e;
      }
      expect(err).to.be.instanceOf(Error);
      expect(String(err)).to.include('404');
    } finally {
      await server.shutdown();
    }
  });
});

const baseUrlFrom = (listener: Deno.HttpServer<Deno.NetAddr>) => {
  const { port } = listener.addr as Deno.NetAddr;
  return `http://127.0.0.1:${port}`;
};
