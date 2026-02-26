import type { t } from './common.ts';

export namespace FsCapability {
  export type Lib = {
    readonly fromFs: (fs: t.Fs.Lib) => Instance;
  };

  /**
   * Portable filesystem/path runtime capability surface.
   *
   * Consumers should rely on a minimal stable subset of `stat` fields.
   * Avoid platform-specific file metadata unless explicitly required and tested.
   */
  export type Instance = {
    readonly read: t.Fs.Lib['read'];
    readonly exists: t.Fs.Lib['exists'];
    readonly copy: t.Fs.Lib['copy'];
    readonly write: t.Fs.Lib['write'];
    readonly ensureDir: t.Fs.Lib['ensureDir'];
    readonly stat: t.Fs.Lib['stat'];
    readonly dirname: t.Fs.Lib['dirname'];
    readonly join: t.Fs.Lib['join'];
    readonly cwd: t.Fs.Lib['cwd'];
    readonly tildeExpand: t.Fs.TildeLib['expand'];
  };
}
