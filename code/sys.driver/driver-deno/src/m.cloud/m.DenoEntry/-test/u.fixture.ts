import { Fs, Json, Pkg, Rx, Str, type t, Testing } from '../../../-test.ts';

export type CreateServeWorkspaceOptions = {
  readonly distDir?: t.StringDir;
  readonly assetName?: string;
  readonly assetCode?: string;
  readonly entrySource?: string;
  readonly html?: string;
  readonly withIndexHtml?: boolean;
  /** Test-only acquisition callback, inside the fixture's cleanup guard. */
  readonly onCreate?: (dir: t.StringDir) => void;
};

export async function createServeWorkspace(options: CreateServeWorkspaceOptions = {}) {
  const fs = await Testing.dir('DenoEntry.serve');
  const life = Rx.lifecycleAsync(async () => {
    await Fs.remove(fs.dir);
  });
  try {
    options.onCreate?.(fs.dir);
    const targetDir = './code/projects/foo';
    const targetRoot = toWorkspacePath(targetDir);
    const distDir = toRelativeDir(options.distDir ?? 'dist');
    const assetName = options.assetName ?? 'app.js';
    const assetPath = `/pkg/${assetName}`;
    const withIndexHtml = options.withIndexHtml ?? true;
    const pkg = { name: '@tmp/foo', version: '0.0.0' } as const;
    const html = options.html ??
      Str.dedent(`
        <!doctype html>
        <html>
          <body>
            <script type="module" src="${assetPath}"></script>
          </body>
        </html>
      `);

    await Fs.write(
      fs.join(targetRoot, 'src/pkg.ts'),
      `export const pkg = ${Json.stringify(pkg, 0)} as const;\n`,
      { throw: true },
    );
    if (options.entrySource) {
      await Fs.write(fs.join(targetRoot, 'src/entry.ts'), options.entrySource, { throw: true });
    }
    if (withIndexHtml) {
      await Fs.write(fs.join(targetRoot, distDir, 'index.html'), html, { throw: true });
    }
    await Fs.write(
      fs.join(targetRoot, distDir, 'pkg', assetName),
      options.assetCode ?? `console.info('foo');\n`,
      { throw: true },
    );
    const computed = await Pkg.Dist.compute({ dir: fs.join(targetRoot, distDir), pkg, save: true });
    if (computed.kind !== 'computed') throw computed.error;

    return {
      ...life,
      assetPath,
      distDir: toRelativeDir(distDir),
      fs,
      hash: computed.pin.digest,
      html,
      targetDir,
    };
  } catch (cause) {
    try {
      await life.dispose();
    } catch (cleanup) {
      throw new SuppressedError(cleanup, cause, 'DenoEntry fixture setup and cleanup failed.');
    }
    throw cause;
  }
}

function toRelativeDir(dir: string) {
  return dir.startsWith('./') ? dir : `./${dir}`;
}

function toWorkspacePath(path: string) {
  return path.startsWith('./') ? path.slice(2) : path;
}
