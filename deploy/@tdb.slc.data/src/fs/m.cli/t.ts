export type * from '../../common/t.ts';

import type { t } from './common.ts';

/**
 * YAML-backed staging CLI helpers for filesystem workflows.
 */
export declare namespace SlcDataCli {
  /** Public staging CLI surface. */
  export type Lib = {
    readonly menu: Menu.Run;
    readonly StageProfile: {
      readonly fs: StageProfileFs;
      readonly schema: StageProfileSchema;
      readonly path: (cwd: t.StringDir, profile: t.StringId) => t.StringFile;
    };
  };

  /** YAML-backed staging profile document. */
  export namespace StageProfile {
    /** One staged data mount and its source folder. */
    export type Doc = {
      readonly mount: t.StringId;
      readonly source: t.StringPath;
    };
  }

  /** Filesystem facts for stage profile config files. */
  export type StageProfileFs = {
    readonly root: t.StringPath;
    readonly dir: t.StringPath;
    readonly ext: t.StringPath;
    readonly defaultName: string;
    readonly targetDir: t.StringPath;
    readonly target: (cwd: t.StringDir, mount: t.StringId) => t.StringDir;
    readonly path: (cwd: t.StringDir, profile: t.StringId) => t.StringFile;
  };

  /** Schema helpers for stage profile documents. */
  export type StageProfileSchema = {
    readonly initial: (mount?: t.StringId) => StageProfile.Doc;
    readonly validate: (value: unknown) => {
      readonly ok: boolean;
      readonly errors: readonly t.ValueError[];
    };
    readonly stringify: (doc: StageProfile.Doc) => string;
    readonly initialYaml: (mount?: t.StringId) => string;
  };

  /** Interactive staging menu. */
  export namespace Menu {
    /** Run the staging menu from a working directory. */
    export type Run = (cwd: t.StringDir) => Promise<Result>;

    /** Result from a staging menu session. */
    export type Result =
      | { readonly kind: 'exit' }
      | { readonly kind: 'back' }
      | { readonly kind: 'staged'; readonly dir: t.StringDir };
  }
}
