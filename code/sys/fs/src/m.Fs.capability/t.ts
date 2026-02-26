import type { t } from './common.ts';

export namespace FsCapability {
  export type Lib = {
    readonly fromFs: (fs: t.FsLib) => Instance;
  };

  /**
   * Portable filesystem/path runtime capability surface.
   *
   * Consumers should rely on a minimal stable subset of `stat` fields.
   * Avoid platform-specific file metadata unless explicitly required and tested.
   */
  export type Instance = {
    readonly read: t.FsLib['read'];
    readonly exists: t.FsLib['exists'];
    readonly copy: t.FsLib['copy'];
    readonly write: t.FsLib['write'];
    readonly ensureDir: t.FsLib['ensureDir'];
    readonly stat: t.FsLib['stat'];
    readonly dirname: t.FsLib['dirname'];
    readonly join: t.FsLib['join'];
    readonly cwd: t.FsLib['cwd'];
    readonly tildeExpand: t.FsTildeLib['expand'];
  };
}
