import { Files } from '@sys/model/files';
import type * as TFiles from '@sys/model/files/t';
import { FilesStatic } from '@sys/model/files/static';
import type * as TFilesStatic from '@sys/model/files/static/t';
import { describe, expect, it, Pkg, type t, Testing } from '../../-test.ts';
import { HttpCmd } from '../mod.ts';

const HASH = {
  digest: `sha256-${'0'.repeat(64)}`,
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
    let backing: TFilesStatic.FilesStatic.Readonly | undefined;

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
          cmd: { ns: Files.Cmd.ns, handlers: backing.handlers },
        });
      }

      return new Response('Not found', { status: 404 });
    });

    const origin = server.url.toURL().origin as t.StringUrl;
    const cmdUrl = `${origin}${ROUTE.cmd}` as t.StringUrl;
    const client = HttpCmd.client<TFiles.Files.Cmd.Name, TFiles.Files.Cmd.Payload, TFiles.Files.Cmd.Result>({
      url: cmdUrl,
      ns: Files.Cmd.ns,
      timeout: 1_000,
    });

    try {
      const fetched = await Pkg.Dist.fetch({ origin });
      expect(fetched.ok).to.eql(true);
      expect(fetched.status).to.eql(200);
      expect(fetched.href).to.eql(`${origin}${ROUTE.dist}`);
      const fetchedDist = fetched.dist;
      expect(Pkg.Is.dist(fetchedDist)).to.eql(true);
      if (!fetchedDist) throw new Error('Expected fetched dist metadata.');
      expect(fetchedDist).to.eql(dist);

      backing = FilesStatic.fromDist({ dist: fetchedDist, baseUrl: origin, policy });

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

      const denied = await expectRemoteCmdError(
        () => client.send(Files.Cmd.Name.read, { path: 'notes/baz.md' }),
        Files.Cmd.Name.read,
      );
      expect(denied.message).to.eql('Read denied: notes/baz.md');

      const watch = await expectRemoteCmdError(
        () => client.send(Files.Cmd.Name.watch, {}),
        Files.Cmd.Name.watch,
      );
      expect(watch.message).to.eql('Static dist backing does not support watch');

      const getRequests = requests.filter((request) => request.startsWith('GET '));
      expect(getRequests).to.eql([`GET ${ROUTE.dist}`]);
      expect(requests.includes('GET /foo.json')).to.eql(false);
      expect(requests.includes('GET /notes/baz.md')).to.eql(false);
      expect(requests.includes('GET /docs/read%20me.md')).to.eql(false);
    } finally {
      client.dispose();
      await server.dispose();
    }
  });
});

function sampleDist(parts: t.CompositeHashParts): t.DistPkg {
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
      digest: HASH.digest,
      parts,
    },
  };
}

function part(hash: t.StringHash, size: t.NumberBytes): t.StringFileHashUri {
  return `${hash}:size=${size}`;
}

function entryPaths(entries: readonly TFiles.Files.Entry[]): readonly TFiles.Files.String.Path[] {
  return entries.map((entry) => entry.path);
}

async function expectRemoteCmdError(
  fn: () => Promise<unknown>,
  name: TFiles.Files.Cmd.Name,
): Promise<t.Cmd.Error.Instance> {
  try {
    await fn();
  } catch (error) {
    expect(error).to.be.instanceOf(Error);
    const err = error as t.Cmd.Error.Instance;
    expect(err.name).to.eql('CmdError.Remote');
    expect(err.cmd?.name).to.eql(name);
    expect(err.cmd?.ns).to.eql(Files.Cmd.ns);
    return err;
  }
  throw new Error(`Expected remote Cmd error for ${name}.`);
}
