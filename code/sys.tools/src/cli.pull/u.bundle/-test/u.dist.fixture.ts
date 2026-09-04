import { Fs, Pkg, type t } from '../../../-test.ts';

export type DistServerFixture = {
  readonly manifest: t.StringUrl;
  readonly integrity: t.StringHash;
  readonly dist: t.DistPkg;
  readonly requests: () => number;
};

/** Remove a test Dist store through its lower owned-tree lifecycle authority. */
export async function removeDistStore(baseDir: t.StringDir): Promise<void> {
  const root = await Fs.realPath(baseDir) as t.StringDir;
  const storeDir = Fs.join(root, '.dist-store') as t.StringDir;
  if (!(await Fs.exists(storeDir))) return;

  const rooted = await Fs.Capability.Rooted.create({ root });
  const admitted = await rooted.Target.admit([{ path: '.dist-store', kind: 'directory' }]);
  const target = admitted.targets[0];
  const acquired = await rooted.Lease.acquire([target], { mode: 'exclusive' });
  if (acquired.kind !== 'acquired') throw new Error('Dist test store is busy.');
  try {
    await rooted.Tree.remove(target, { lease: acquired.lease });
  } finally {
    await acquired.lease.release();
  }
}

/** Run a neutral loopback server over one publisher-computed Dist fixture. */
export async function usingDistServer(
  fn: (fixture: DistServerFixture) => Promise<void>,
  options: { readonly indexHtml?: string } = {},
): Promise<void> {
  const root = await Fs.makeTempDir({ prefix: 'sys.tools.pull.dist.' });
  const sourceDir = Fs.join(root.absolute, 'source');
  await Fs.ensureDir(sourceDir);
  if (options.indexHtml !== undefined) {
    await Fs.write(Fs.join(sourceDir, 'index.html'), options.indexHtml, { force: true });
  }
  await Fs.write(Fs.join(sourceDir, 'asset.txt'), 'fixture-asset', { force: true });

  const computed = await Pkg.Dist.compute({
    dir: sourceDir,
    pkg: { name: '@sample/foo', version: '1.0.0' },
    builder: { name: '@sample/builder', version: '1.0.0' },
    save: true,
  });
  const files = new Map<string, Uint8Array>();
  for (const path of ['dist.json', ...Object.keys(computed.dist.hash.parts)]) {
    const read = await Fs.read(Fs.join(sourceDir, path));
    if (!read.ok || !read.data) throw new Error(`Missing Dist fixture file: ${path}`);
    files.set(`/${path}`, read.data);
  }

  let requests = 0;
  const abort = new AbortController();
  const server = Deno.serve({ port: 0, signal: abort.signal }, (request) => {
    requests += 1;
    const bytes = files.get(new URL(request.url).pathname);
    const body = bytes?.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    return body ? new Response(body as ArrayBuffer) : new Response('not found', { status: 404 });
  });

  try {
    const { port } = server.addr;
    await fn({
      manifest: `http://127.0.0.1:${port}/dist.json` as t.StringUrl,
      integrity: computed.manifest.integrity,
      dist: computed.dist,
      requests: () => requests,
    });
  } finally {
    abort.abort();
    await server.finished.catch(() => undefined);
    await Fs.remove(root.absolute);
  }
}
