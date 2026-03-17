import { type t, Fs, HttpServer, Pkg, Str } from './common.ts';

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
  const cwd = Fs.resolve(options.cwd ?? Fs.cwd());
  const targetDir = trustedPath(cwd, options.targetDir, 'targetDir');
  const distDir = trustedPath(targetDir, options.distDir ?? 'dist', 'distDir');
  const pkgPath = trustedPath(targetDir, './src/pkg.ts', 'pkg.ts');
  const pkgModule = await import(Fs.Path.toFileUrl(pkgPath).href);
  const sourcePkg = pkgModule.pkg;

  const dist = await verifyDist(distDir);
  const pkg = dist.pkg || sourcePkg;
  const hash = dist.hash.digest;

  return { distDir, pkg, hash } as const;
}

function fallback(distDir: string) {
  return async function onNotFound(path: string, c: t.HonoContext) {
    const leaf = Fs.Path.basename(path);

    if (leaf.includes('.')) {
      c.res = c.text('Not Found', 404);
      return;
    }

    const indexHtmlPath = Fs.join(distDir, 'index.html');
    const exists = await Fs.exists(indexHtmlPath);
    if (!exists) {
      c.res = c.text(`Missing dist index.html: ${indexHtmlPath}`, 500);
      return;
    }

    const html = (await Fs.readText(indexHtmlPath)).data ?? '';
    const headers = { 'content-type': 'text/html; charset=utf-8' };
    c.res = new Response(html, { headers });
  };
}

function trustedPath(root: t.StringPath, rel: t.StringRelativePath, label: string) {
  const path = Fs.resolve(Fs.join(root, rel));
  if (path !== root && !path.startsWith(Fs.join(root, ''))) {
    throw new Error(`DenoEntry.serve: '${label}' escapes root '${root}': ${rel}`);
  }
  return path;
}

async function verifyDist(distDir: t.StringDir) {
  const verification = await Pkg.Dist.verify(distDir);
  if (verification.is.valid === true && verification.dist) return verification.dist;

  throw new Error(
    Str.dedent(`
      DenoEntry.serve: invalid dist artifact.

      distDir: ${distDir}
      error: ${verification.error?.message ?? 'Unknown dist verification failure.'}
    `),
  );
}
