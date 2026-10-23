import { createServer } from 'vite';
import { expect, Fs, Path } from '../../-test.ts';
import { ViteConfig } from '../mod.ts';

/** Run native Vite lifecycle work in the bounded child, not the parent sanitizer scope. */
export async function proveServerFs(base: string) {
  const fs = await Fs.makeTempDir({ prefix: 'ViteConfig.app.fs-http.' });
  try {
    const app = Fs.join(fs.absolute, 'app');
    const linked = Fs.join(fs.absolute, 'app-link');
    const sibling = Fs.join(fs.absolute, 'app-sibling');
    await Fs.ensureDir(app);
    await Fs.ensureDir(sibling);
    await Fs.write(Fs.join(app, 'index.html'), '<!doctype html><title>Filesystem identity</title>');
    await Fs.write(Fs.join(app, 'inside.txt'), 'INSIDE_ROOT');
    await Fs.write(Fs.join(app, '.env'), 'DENIED_ENV_SENTINEL');
    await Fs.write(Fs.join(sibling, 'outside.txt'), 'OUTSIDE_ROOT_SENTINEL');
    await Fs.ensureSymlink(app, linked);
    await Fs.ensureSymlink(Fs.join(app, 'inside.txt'), Fs.join(app, 'inside-link.txt'));
    await Fs.ensureSymlink(Fs.join(app, '.env'), Fs.join(app, 'env-link.txt'));
    await Fs.ensureSymlink(Fs.join(sibling, 'outside.txt'), Fs.join(app, 'escape.txt'));
    await Fs.ensureSymlink(sibling, Fs.join(app, 'escape-dir'));

    const config = await ViteConfig.app({
      paths: ViteConfig.paths({ cwd: linked }),
      workspace: false,
      plugins: { deno: false, react: false, wasm: false, optimizeImports: false },
    });
    const server = await createServer({
      ...config,
      configFile: false,
      base,
      server: { ...config.server, host: '127.0.0.1', port: 0 },
    });
    try {
      await server.listen();
      const url = server.resolvedUrls?.local[0];
      if (!url) throw new Error('Expected a listening dev server');
      expect(server.config.server.fs.strict).to.eql(true);
      for (const path of ['inside.txt', 'inside-link.txt']) {
        const res = await fetch(new URL(path, url), { signal: AbortSignal.timeout(5_000) });
        const body = await res.text();
        expect(res.status, body).to.eql(200);
        expect(body).to.eql('INSIDE_ROOT');
      }
      const denied = [
        'escape.txt',
        'escape.txt?raw',
        'escape-dir/outside.txt',
        'env-link.txt',
        `@fs/${Path.normalize(await Fs.realPath(Fs.join(sibling, 'outside.txt')))}`,
      ];
      for (const path of denied) {
        const res = await fetch(new URL(path, url), { signal: AbortSignal.timeout(5_000) });
        const body = await res.text();
        expect(res.status, `${path}\n${body}`).to.eql(403);
        expect(body).not.to.include('OUTSIDE_ROOT_SENTINEL');
        expect(body).not.to.include('DENIED_ENV_SENTINEL');
      }
    } finally {
      await server.close();
    }
  } finally {
    await Fs.remove(fs.absolute);
  }
}
