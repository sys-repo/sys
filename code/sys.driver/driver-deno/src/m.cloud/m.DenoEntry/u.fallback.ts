import { type t, Fs } from './common.ts';

export function fallback(distDir: string) {
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
