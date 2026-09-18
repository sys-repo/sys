import { CompositeHash, Hash } from '@sys/crypto/hash';
import { Ignore } from '@sys/std/ignore';
import { R2 } from '@sys/driver-cloudflare/r2';
import { Json, type t, WebFixture } from '../-test.ts';
import { LIMITS } from '../m.app/u.selection.ts';

/** Manifest and storage bytes owned entirely by the fixture. */
export async function remoteFixture() {
  const encoder = new TextEncoder();
  const content = new Map<string, Uint8Array>([
    ['index.html', encoder.encode('<h1>fixture</h1>')],
    ['pkg/file.js', encoder.encode('export {};')],
  ]);
  const parts = Object.fromEntries([...content].map(([path, bytes]) => [
    path,
    `${Hash.sha256(bytes)}:size=${bytes.byteLength}`,
  ]));
  const dist: t.DeepMutable<t.DistPkg> = {
    type: 'https://example.com/dist',
    pkg: { name: '@test/r2', version: '0.0.0' },
    build: {
      time: 1,
      size: { total: 26, pkg: 10 },
      builder: '@test/builder@1.0.0',
      runtime: 'fixture',
      hash: {
        policy: 'https://example.com/hash',
        ignore: { format: 'gitignore', rules: [], 'rules:digest': await Ignore.digest([]) },
      },
    },
    hash: { digest: CompositeHash.digest(parts), parts },
  };
  const manifest = encoder.encode(Json.stringify(dist));
  content.set('dist.json', manifest);
  const pin = { 'dist.json': Hash.sha256(manifest) };
  const config: t.Config = {
    accountId: '0'.repeat(32),
    bucket: 'sample',
    prefix: 'sample/ui',
    credentials: {
      accessKeyId: 'R2_SAMPLE_ACCESS_KEY_ID',
      secretAccessKey: 'R2_SAMPLE_SECRET_ACCESS_KEY',
    },
    limits: LIMITS,
  };
  const signed: string[] = [];
  const fetched: Request[] = [];
  const bucket = {
    name: config.bucket,
    presignGet(key: string) {
      signed.push(key);
      return Promise.resolve(
        `${R2.Service.storageUrl(config.accountId)}/${config.bucket}/${key}?signature=fixture`,
      );
    },
  };
  const fixture = {
    config,
    pin,
    dist,
    manifest,
    content,
    bucket,
    signed,
    fetched,
    read(req: Request): Promise<Response> {
      const path = new URL(req.url).pathname.slice(`/${config.bucket}/${config.prefix}/`.length);
      const bytes = content.get(path);
      return Promise.resolve(
        bytes ? new Response(new Uint8Array(bytes)) : new Response(null, { status: 404 }),
      );
    },
    [Symbol.dispose]() {
      mock.dispose();
    },
  };
  const mock = WebFixture.Fetch.mock((input, init) => {
    const req = new Request(input, init);
    fetched.push(req);
    return fixture.read(req);
  });
  return fixture;
}
