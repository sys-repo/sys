import { type t, Fs, Path, Str } from '../common.ts';

/**
 * Ensure a minimal root index.html exists at the staging root.
 * - Writes only when missing.
 * - Idempotent.
 */
export async function ensureRootIndexHtml(
  cwd: t.StringDir,
  stagingRoot: t.StringRelativeDir,
): Promise<void> {
  const file = Path.join(cwd, stagingRoot, 'index.html');
  if (await Fs.exists(file)) return;
  await Fs.write(file, HTML);
}

const HTML = Str.dedent(`
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Index</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        body {
          margin: 0;
          padding: 24px;
          font-family: sans-serif;
          font-size: 16px;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <ul>
        <li><a href="./dist.json">dist.json</a></li>
      </ul>
    </body>
  </html>
`);
