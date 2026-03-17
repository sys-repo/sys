import { type t, Fs, Pkg, Str, Testing } from '../../../-test.ts';

export type CreateServeWorkspaceOptions = {
  readonly distDir?: t.StringDir;
  readonly assetName?: string;
  readonly assetCode?: string;
  readonly html?: string;
};

export async function createServeWorkspace(options: CreateServeWorkspaceOptions = {}) {
  const fs = await Testing.dir('DenoEntry.serve');
  const targetDir = './code/projects/foo';
  const distDir = options.distDir ?? 'dist';
  const assetName = options.assetName ?? 'app.js';
  const assetPath = `/pkg/${assetName}`;
  const html =
    options.html ??
    Str.dedent(
      `
        <!doctype html>
        <html>
          <body>
            <script type="module" src="${assetPath}"></script>
          </body>
        </html>
      `,
    );

  await Fs.write(
    fs.join('code/projects/foo/src/pkg.ts'),
    `export const pkg = { name: '@tmp/foo', version: '0.0.0' } as const;\n`,
  );
  await Fs.write(fs.join('code/projects/foo', distDir, 'index.html'), html);
  await Fs.write(
    fs.join('code/projects/foo', distDir, 'pkg', assetName),
    options.assetCode ?? `console.info('foo');\n`,
  );
  const dist = (
    await Pkg.Dist.compute({
      dir: fs.join('code/projects/foo', distDir),
      pkg: { name: '@tmp/foo', version: '0.0.0' },
      save: true,
    })
  ).dist;

  return {
    assetPath,
    distDir: `./${distDir}`,
    fs,
    hash: dist?.hash?.digest ?? '',
    html,
    targetDir,
  };
}
