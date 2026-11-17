import { Hash } from '@sys/crypto/hash';
import { Files } from '@sys/model/files';
import type { Files as TFiles } from '@sys/model/files/t';
import { FilesStatic } from '@sys/model/files/static';
import type { FilesStatic as TFilesStatic } from '@sys/model/files/static/t';
import { describe, expect, it, Json, Pkg, type t, Testing } from '../../-test.ts';
import { Fetch } from '../../http.client/m.HttpFetch/mod.ts';
import { HttpCmd } from '../mod.ts';
import { expectFailure } from './u.fixture.ts';

const HASH = {
  foo: `sha256-${'1'.repeat(64)}`,
  baz: `sha256-${'2'.repeat(64)}`,
  readme: `sha256-${'3'.repeat(64)}`,
} as const satisfies Record<string, t.StringHash>;

const ROUTE = {
  dist: '/dist.json',
  cmd: '/cmd',
} as const;

describe('HttpCmd + FilesStatic dist integration', () => {
  it('loads dist.json over HTTP and serves the static Files capability through Cmd HTTP JSON', async () => {
    const dist = sampleDist({
      'foo.json': part(HASH.foo, 16),
      'notes/baz.md': part(HASH.baz, 6),
      'docs/read me.md': part(HASH.readme, 9),
    });
    const policy = Files.Policy.readonly('**', { deny: 'notes/baz.md' });
    const requests: string[] = [];
    let backing: TFilesStatic.Readonly | undefined;

    const server = Testing.Http.server((request) => {
      const url = new URL(request.url);
      requests.push(`${request.method} ${url.pathname}`);

      if (request.method === 'GET' && url.pathname === ROUTE.dist) {
        return Testing.Http.json(dist);
      }

      if (url.pathname === ROUTE.cmd) {
        if (!backing) throw new Error('FilesStatic backing not initialized.');
        return HttpCmd.handle(request, {
          path: ROUTE.cmd,
          policy: {
            maxBytes: { request: 1024 * 1024, response: 8 * 1024 * 1024 },
            timeout: 30_000,
          },
          cmd: { ns: Files.Cmd.ns, handlers: backing.handlers },
        });
      }

      return new Response('Not found', { status: 404 });
    });

    const origin: t.StringUrl = server.url.toURL().origin;
    const cmdUrl: t.StringUrl = `${origin}${ROUTE.cmd}`;
    const client = HttpCmd.client<
      TFiles.Cmd.Name,
      TFiles.Cmd.Payload,
      TFiles.Cmd.Result
    >({
      url: cmdUrl,
      ns: Files.Cmd.ns,
      policy: {
        maxBytes: { request: 1024 * 1024, response: 8 * 1024 * 1024 },
        timeout: 1_000,
      },
    });
    const manifestUrl: t.StringUrl = `${origin}${ROUTE.dist}`;
    const manifestFetch = Fetch.make({
      policy: {
        maxBytes: 1024 * 1024,
        timeout: 1_000,
        maxRedirects: 0,
        progressInterval: 100,
        sourceOrigins: [origin],
        credentialOrigins: [],
      },
    });

    try {
      // Fixture-owned document bytes check transport only; this is not a Dist content pin.
      const fetched = await manifestFetch.blob(manifestUrl, undefined, {
        checksum: Hash.sha256(Json.stringify(dist, 2)),
      });
      expect(fetched.ok).to.eql(true);
      expect(fetched.status).to.eql(200);
      if (!fetched.ok) throw fetched.error;
      expect(fetched.requestedUrl).to.eql(manifestUrl);
      expect(fetched.finalUrl).to.eql(manifestUrl);
      expect(fetched.checksum?.valid).to.eql(true);
      const fetchedDist = Json.parse<unknown>(await fetched.data.text());
      expect(Pkg.Is.dist(fetchedDist)).to.eql(true);
      if (!Pkg.Is.dist(fetchedDist)) throw new Error('Expected fetched dist metadata.');
      expect(fetchedDist).to.eql(dist);

      backing = FilesStatic.fromDist({
        dist: fetchedDist.hash,
        buildTime: fetchedDist.build.time,
        baseUrl: origin,
        policy,
      });

      const capabilities = await client.send(Files.Cmd.Name.capabilities, {});
      expect(capabilities).to.eql({
        list: true,
        stat: true,
        read: true,
        write: false,
        remove: false,
        watch: false,
        manifest: true,
        fidelity: 'snapshot',
      });

      const list = await client.send(Files.Cmd.Name.list, {});
      expect(entryPaths(list.entries)).to.eql(['docs', 'docs/read me.md', 'foo.json', 'notes']);

      const matched = await client.send(Files.Cmd.Name.list, { match: '**/*.md' });
      expect(entryPaths(matched.entries)).to.eql(['docs/read me.md']);

      const excluded = await client.send(Files.Cmd.Name.list, {
        exclude: ['docs', 'docs/**'],
      });
      expect(entryPaths(excluded.entries)).to.eql(['foo.json', 'notes']);

      const scoped = await client.send(Files.Cmd.Name.list, { path: 'docs', depth: 1 });
      expect(scoped.entries).to.eql([
        { path: 'docs/read me.md', kind: 'file', size: 9, hash: HASH.readme },
      ]);

      const stat = await client.send(Files.Cmd.Name.stat, { path: 'foo.json' });
      expect(stat).to.eql({
        entry: { path: 'foo.json', kind: 'file', size: 16, hash: HASH.foo },
      });

      const read = await client.send(Files.Cmd.Name.read, { path: 'docs/read me.md' });
      expect(read).to.eql({
        kind: 'ref',
        file: { path: 'docs/read me.md', kind: 'file', size: 9, hash: HASH.readme },
        contentRef: {
          kind: 'url',
          path: 'docs/read me.md',
          size: 9,
          hash: HASH.readme,
          url: `${origin}/docs/read%20me.md`,
        },
      });

      const manifest = await client.send(Files.Cmd.Name.manifest, { contentRefs: true });
      expect(entryPaths(manifest.entries)).to.eql(['docs', 'docs/read me.md', 'foo.json', 'notes']);
      expect(manifest.contentRefs).to.eql([
        {
          kind: 'url',
          path: 'docs/read me.md',
          size: 9,
          hash: HASH.readme,
          url: `${origin}/docs/read%20me.md`,
        },
        {
          kind: 'url',
          path: 'foo.json',
          size: 16,
          hash: HASH.foo,
          url: `${origin}/foo.json`,
        },
      ]);

      const denied = await expectFailure(
        () => client.send(Files.Cmd.Name.read, { path: 'notes/baz.md' }),
        'remote',
      );
      expect(denied.status).to.eql(500);

      const watch = await expectFailure(() => client.send(Files.Cmd.Name.watch, {}), 'remote');
      expect(watch.status).to.eql(500);

      const getRequests = requests.filter((request) => request.startsWith('GET '));
      expect(getRequests).to.eql([`GET ${ROUTE.dist}`]);
      expect(requests.includes('GET /foo.json')).to.eql(false);
      expect(requests.includes('GET /notes/baz.md')).to.eql(false);
      expect(requests.includes('GET /docs/read%20me.md')).to.eql(false);
    } finally {
      manifestFetch.dispose('test.cleanup');
      client.dispose();
      await server.dispose();
    }
  });
});

function sampleDist(parts: t.DistContent['parts']): t.DistPkg {
  return {
    type: 'https://jsr.io/@sys/types/0.0.0/src/types/t.Pkg.dist.ts',
    build: {
      time: 1_700_000_000_000,
      size: { total: 31, pkg: 0 },
      builder: 'fixture@0.0.0',
      runtime: 'deno=fixture',
      hash: { policy: 'fixture:dist-policy' },
    },
    hash: {
      scheme: 'sys.dist/v2',
      digest: Hash.sha256(Pkg.Dist.Content.encode(parts)),
      parts,
    },
  };
}

function part(hash: t.StringHash, size: t.NumberBytes): t.StringFileHashUri {
  return `${hash}:size=${size}`;
}

function entryPaths(entries: readonly TFiles.Entry[]): readonly TFiles.String.Path[] {
  return entries.map((entry) => entry.path);
}
