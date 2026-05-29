import { describe, expect, it } from '../../src/-test.ts';
import { SampleFiles } from './-config.ts';
import { Files, FilesStatic, HttpStatic, Pkg, type t } from './common.ts';

describe('sample:files:http:static', () => {
  it('serves dist.json and reconstructs static Files content refs over plain HTTP', async () => {
    const server = await HttpStatic.start({
      dir: SampleFiles.root,
      hostname: '127.0.0.1',
      port: 0,
      silent: true,
      name: SampleFiles.name,
      info: { dist: SampleFiles.paths.dist },
    });

    let files: t.Files.Client.Local | undefined;
    async function proveStaticPublication() {
      const origin = server.origin as t.StringUrl;
      const dist = await fetchDist(origin);
      const backing = FilesStatic.fromDist({
        dist,
        baseUrl: origin,
        policy: SampleFiles.policy,
      });

      files = Files.Client.local(backing);
      await assertManifest(files, dist);
      await assertReadRefResolvesAsset(files, origin);
    }

    try {
      await proveStaticPublication();
    } finally {
      files?.dispose('test.cleanup');
      await server.close('test.cleanup');
      await server.finished;
    }
  });
});

/**
 * Helpers:
 */
async function fetchDist(origin: t.StringUrl): Promise<t.DistPkg> {
  const fetched = await Pkg.Dist.fetch({ origin });
  expect(fetched.ok).to.eql(true);
  expect(fetched.status).to.eql(200);
  expect(fetched.href).to.eql(`${origin}/dist.json`);
  if (!fetched.dist) throw new Error('Expected dist.json.');
  return fetched.dist;
}

async function assertManifest(files: t.Files.Client.Local, dist: t.DistPkg) {
  const manifest = await files.cmd.send(Files.Cmd.Name.manifest, { contentRefs: true });
  expect(manifest['.meta'].version).to.eql('sys.files.manifest:v1');
  expect(manifest['.meta'].dist?.build.time).to.eql(dist.build.time);
  expect(manifest.entries.map((entry) => entry.path)).to.eql([
    'docs',
    'docs/README.md',
    'hello.json',
    'hello.txt',
  ]);
  expect(manifest.contentRefs?.map((ref) => ref.path)).to.eql([
    'docs/README.md',
    'hello.json',
    'hello.txt',
  ]);
}

async function assertReadRefResolvesAsset(files: t.Files.Client.Local, origin: t.StringUrl) {
  const read = await files.cmd.send(Files.Cmd.Name.read, { path: SampleFiles.paths.readme });
  expect(read.kind).to.eql('ref');
  if (read.kind !== 'ref') throw new Error('Expected static Files read to return a ref.');

  const ref = read.contentRef;
  expect(ref.kind).to.eql('url');
  if (ref.kind !== 'url') throw new Error('Expected static Files ref to be a URL.');
  expect(ref.url).to.eql(`${origin}/docs/README.md`);

  const text = await Files.ContentRef.text(ref);
  expect(text).to.contain('Files static sample');
}
