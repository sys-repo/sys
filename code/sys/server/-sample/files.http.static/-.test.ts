import { describe, expect, it } from '../../src/-test.ts';
import { SampleFiles } from './-config.ts';
import { Fetch, Files, FilesStatic, Fs, Hash, HttpStatic, Json, Pkg, type t } from './common.ts';

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
    try {
      const origin = server.origin as t.StringUrl;
      const dist = await fetchPinnedDist(origin);
      const backing = FilesStatic.fromDist({
        dist,
        baseUrl: origin,
        policy: SampleFiles.policy,
      });

      files = Files.Client.local(backing);
      await assertManifest(files, dist);
      await assertReadRefResolvesAsset(files, origin);
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
async function fetchPinnedDist(origin: t.StringUrl): Promise<t.DistPkg> {
  const path = Fs.join(SampleFiles.root, 'dist.json');
  const manifest = await Fs.read(path);
  if (!manifest.data) throw new Error(`Expected local manifest fixture: ${path}`);

  const url = `${origin}/dist.json` as t.StringUrl;
  const fetch = Fetch.make({
    policy: {
      maxBytes: manifest.data.byteLength,
      timeout: 1_000,
      maxRedirects: 0,
      progressInterval: 100,
      sourceOrigins: [origin],
      credentialOrigins: [],
    },
  });

  try {
    const fetched = await fetch.blob(url, undefined, {
      checksum: Hash.sha256(manifest.data),
    });
    expect(fetched.ok).to.eql(true);
    expect(fetched.status).to.eql(200);
    if (!fetched.ok) throw fetched.error;
    expect(fetched.requestedUrl).to.eql(url);
    expect(fetched.finalUrl).to.eql(url);
    expect(fetched.checksum?.valid).to.eql(true);

    const value = Json.parse<unknown>(await fetched.data.text());
    if (!Pkg.Is.dist(value)) throw new Error('Expected canonical dist.json.');
    return value;
  } finally {
    fetch.dispose('test.cleanup');
  }
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
