import { CompositeHash, Hash } from '@sys/crypto/hash';
import { Ignore } from '@sys/std/ignore';
import { R2 } from '@sys/driver-cloudflare/r2';
import { Json, type t, WebFixture } from '../-test.ts';
import { fixtureConfig } from './u.config.ts';

/** Manifest and storage bytes owned entirely by the fixture. */
export async function remoteFixture() {
  const encoder = new TextEncoder();
  const html = encoder.encode('<h1>fixture</h1>');
  const content = new Map<string, Uint8Array>([['index.html', html]]);
  const parts = Object.fromEntries([...content].map(([path, bytes]) => [
    path,
    `${Hash.sha256(bytes)}:size=${bytes.byteLength}`,
  ]));
  const dist: t.DeepMutable<t.DistPkg> = {
    type: 'https://example.com/dist',
    pkg: { name: '@test/r2', version: '0.0.0' },
    build: {
      time: 1,
      size: { total: html.byteLength, pkg: 0 },
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
  const config = fixtureConfig();
  const selection = {
    private: pin,
    public: { 'dist.json': Hash.sha256('fixture-public-manifest') },
    publicAssetBase: config.publicAssetBase,
  };
  // Even if these public keys also exist privately, Deno must never relay them.
  content.set('pkg/file.js', encoder.encode('export {};'));
  content.set('pkg/file.css', encoder.encode('body {}'));
  const target = config.targets.private;
  const signed: string[] = [];
  const fetched: Request[] = [];
  const bucket = {
    name: target.bucket,
    presignGet(key: string) {
      signed.push(key);
      return Promise.resolve(
        `${R2.Service.storageUrl(config.accountId)}/${target.bucket}/${key}?signature=fixture`,
      );
    },
  };
  const fixture = {
    config,
    pin,
    selection,
    dist,
    manifest,
    content,
    bucket,
    signed,
    fetched,
    read(req: Request): Promise<Response> {
      const path = new URL(req.url).pathname.slice(`/${target.bucket}/${target.prefix}/`.length);
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
    const url = new URL(req.url);
    const prefix = `/${target.bucket}/${target.prefix}/`;
    if (
      req.method !== 'GET' ||
      url.origin !== R2.Service.storageUrl(config.accountId) ||
      !url.pathname.startsWith(prefix)
    ) {
      throw new Error(
        `Unexpected fixture storage request: ${req.method} ${url.origin}${url.pathname}`,
      );
    }
    fetched.push(req);
    return fixture.read(req);
  });
  return fixture;
}
