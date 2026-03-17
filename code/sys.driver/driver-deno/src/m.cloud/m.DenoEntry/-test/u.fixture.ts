import { type t, Fs, Pkg, Str, Testing } from '../../../-test.ts';

export type CreateServeWorkspaceOptions = {
  readonly distDir?: t.StringDir;
  readonly assetName?: string;
  readonly assetCode?: string;
  readonly entrySource?: string;
  readonly html?: string;
  readonly withIndexHtml?: boolean;
};

export async function createServeWorkspace(options: CreateServeWorkspaceOptions = {}) {
  const fs = await Testing.dir('DenoEntry.serve');
  const targetDir = './code/projects/foo';
  const targetRoot = toWorkspacePath(targetDir);
  const distDir = toRelativeDir(options.distDir ?? 'dist');
  const assetName = options.assetName ?? 'app.js';
  const assetPath = `/pkg/${assetName}`;
  const withIndexHtml = options.withIndexHtml ?? true;
  const pkg = { name: '@tmp/foo', version: '0.0.0' } as const;
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
    fs.join(targetRoot, 'src/pkg.ts'),
    `export const pkg = ${JSON.stringify(pkg)} as const;\n`,
  );
  if (options.entrySource) {
    await Fs.write(fs.join(targetRoot, 'src/entry.ts'), options.entrySource);
  }
  if (withIndexHtml) {
    await Fs.write(fs.join(targetRoot, distDir, 'index.html'), html);
  }
  await Fs.write(
    fs.join(targetRoot, distDir, 'pkg', assetName),
    options.assetCode ?? `console.info('foo');\n`,
  );
  const dist = (
    await Pkg.Dist.compute({
      dir: fs.join(targetRoot, distDir),
      pkg,
      save: true,
    })
  ).dist;

  return {
    assetPath,
    distDir: toRelativeDir(distDir),
    fs,
    hash: dist?.hash?.digest ?? '',
    html,
    targetDir,
  };
}

function toRelativeDir(dir: string) {
  return dir.startsWith('./') ? dir : `./${dir}`;
}

function toWorkspacePath(path: string) {
  return path.startsWith('./') ? path.slice(2) : path;
}
