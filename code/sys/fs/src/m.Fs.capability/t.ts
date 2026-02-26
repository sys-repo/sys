import type { t } from './common.ts';

export namespace FsCapability {
  /**
   * Portable filesystem/path runtime capability surface.
   *
   * NOTE:
   * Consumers should rely on a minimal stable subset of `stat` fields.
   * For the current compiler media-seq adapter integration, usage is constrained to `size`.
   */
  export type Lib = {
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
