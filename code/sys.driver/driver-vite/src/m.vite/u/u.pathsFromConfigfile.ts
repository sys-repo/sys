import type { t } from '../common.ts';
import { Path } from '@sys/fs/path';
import { Perf } from '../../common/u.perf.ts';
import { fromFile } from '../../m.vite.config/u/u.fromFile.ts';

/**
 * Resolve Vite application paths from one configuration file.
 */
export async function pathsFromConfigfile(cwd?: t.StringDir): Promise<t.ViteConfig.Paths> {
  const rootDir = cwd || Path.cwd();
  const end = Perf.section('wrangle.pathsFromConfigfile', { cwd: rootDir }, { level: 2 });
  const filename = 'vite.config.ts';
  const path = Path.join(rootDir, filename);

  const res = await fromFile(path);
  let paths = res.paths;

  if (!paths) {
    const err =
      `Failed to load paths from [${filename}], ensure it exports "paths". Source: ${path}`;
    console.error(res.error);
    throw new Error(err);
  }

  const delta = Path.relative(paths.cwd, rootDir);
  if (delta) {
    /**
     * When config discovery is performed from a copied fixture or nested temp root,
     * the resolved config paths can be rooted at a different CWD than the caller.
     * Adjust the application entry/output subpaths to preserve the caller-relative
     * build layout.
     */
    const entry = Path.normalize(Path.join(delta, paths.app.entry));
    const outDir = Path.normalize(Path.join(delta, paths.app.outDir));
    const app = { ...paths.app, entry, outDir };
    paths = { ...paths, app };
  }

  end({ config: path, entry: paths.app.entry, outDir: paths.app.outDir });
  return paths;
}
