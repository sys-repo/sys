import { Obj, type t } from './common.ts';
import type { PreviewBuildPaths } from './m.start.gui.preview.build/t.ts';

/** Package-owned Driver Pi Vite path authority shared by config and isolated preview builds. */
export function vitePaths(
  cwd: t.StringDir,
  outDir: t.StringDir = 'dist',
): PreviewBuildPaths {
  return Obj.deepFreeze({
    cwd,
    app: {
      entry: 'src/index.html',
      sw: 'src/-test/-sw.ts',
      outDir,
      base: './',
    },
  });
}
