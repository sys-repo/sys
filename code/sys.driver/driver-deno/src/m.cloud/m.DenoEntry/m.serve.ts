import { type t, Fs, HttpServer, Pkg } from './common.ts';

export const serve: t.DenoEntry.Serve = async (options) => {
  const { pkg, hash, distDir } = await loadTarget(options);

  const app = HttpServer.create({ pkg, hash, static: false });
  const server = HttpServer.static({ root: distDir, onNotFound: fallback(distDir) });
  app.use('*', server);

  return { fetch: app.fetch };
};

/**
 * Helpers:
 */
async function loadTarget(options: t.DenoEntry.ServeOptions) {
  const cwd = options.cwd ?? Fs.cwd();
  const targetDir = Fs.join(cwd, options.targetDir);
  const distDir = Fs.join(targetDir, options.distDir ?? 'dist');
  const pkgPath = Fs.join(targetDir, 'src/pkg.ts');
  const pkgModule = await import(Fs.Path.toFileUrl(pkgPath).href);
  const sourcePkg = pkgModule.pkg;

  const dist = (await Pkg.Dist.load(distDir)).dist;
  const pkg = dist?.pkg || sourcePkg;
  const hash = dist?.hash.digest;

  return { distDir, pkg, hash } as const;
}

function fallback(distDir: string) {
  return async function onNotFound(path: string, c: t.HonoContext) {
    const leaf = Fs.Path.basename(path);

    if (leaf.includes('.')) {
      c.res = c.text('Not Found', 404);
      return;
    }

    const html = (await Fs.readText(Fs.join(distDir, 'index.html'))).data ?? '';
    const headers = { 'content-type': 'text/html; charset=utf-8' };
    c.res = new Response(html, { headers });
  };
}
