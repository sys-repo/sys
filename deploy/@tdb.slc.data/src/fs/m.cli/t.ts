export type * from '../../common/t.ts';

import type { t } from './common.ts';

/**
 * YAML-backed staging CLI helpers for filesystem workflows.
 */
export declare namespace SlcDataCli {
  /** Public staging CLI surface. */
  export type Lib = {
    readonly menu: Menu.Run;
    readonly help: Help.Run;
    readonly run: Run;
    readonly StageProfile: {
      readonly fs: StageProfileFs;
      readonly schema: StageProfileSchema;
      readonly path: (cwd: t.StringDir, profile: t.StringId) => t.StringFile;
      readonly create: StageProfile.Create;
      readonly stage: StageProfile.Stage;
    };
  };

  /** Raw CLI entrypoint input. */
  export type Input = {
    readonly cwd?: t.StringDir;
    readonly argv?: readonly string[];
    readonly target?: t.StringDir;
  };

  /** Supported non-interactive subcommands. */
  export type Command = 'create' | 'stage';

  /** Parsed CLI args. */
  export type Args = {
    readonly _: string[];
    readonly help?: boolean;
    readonly profile?: t.StringId;
    readonly source?: t.StringPath;
    readonly target?: t.StringDir;
    readonly command?: Command;
  };

  /** Run the CLI from raw argv input. */
  export type Run = (input?: Input) => Promise<Result>;

  /** Result from one CLI run. */
  export type Result = Help.Result | Menu.Result | StageProfile.CreateResult | StageProfile.StageResult;

  /** YAML-backed staging profile document. */
  export namespace StageProfile {
    /** One staged data mount and its source folder. */
    export type Doc = {
      readonly mount: t.StringId;
      readonly source: t.StringPath;
    };

    /** Create one stage profile file. */
    export type Create = (args: {
      readonly cwd: t.StringDir;
      readonly profile: t.StringId;
      readonly source: t.StringPath;
    }) => Promise<CreateResult>;

    /** Result from creating one stage profile file. */
    export type CreateResult = {
      readonly kind: 'created';
      readonly path: t.StringFile;
    };

    /** Stage one named profile from the working directory. */
    export type Stage = (args: {
      readonly cwd: t.StringDir;
      readonly profile: t.StringId;
      readonly target?: t.StringDir;
    }) => Promise<StageResult>;

    /** Result from staging one profile. */
    export type StageResult = {
      readonly kind: 'staged';
      readonly dir: t.StringDir;
    };
  }

  /** Filesystem facts for stage profile config files. */
  export type StageProfileFs = {
    readonly configDir: (cwd: t.StringDir) => t.StringDir;
    readonly targetRoot: (cwd: t.StringDir) => t.StringDir;
    readonly target: (cwd: t.StringDir, mount: t.StringId) => t.StringDir;
    readonly path: (cwd: t.StringDir, profile: t.StringId) => t.StringFile;
  };

  /** Schema helpers for stage profile documents. */
  export type StageProfileSchema = {
    readonly initial: (mount: t.StringId) => StageProfile.Doc;
    readonly validate: (value: unknown) => {
      readonly ok: boolean;
      readonly errors: readonly t.ValueError[];
    };
    readonly stringify: (doc: StageProfile.Doc) => string;
    readonly initialYaml: (mount: t.StringId) => string;
  };

  /** Interactive staging menu. */
  export namespace Menu {
    /** Run the staging menu from a working directory. */
    export type Run = (cwd: t.StringDir, target?: t.StringDir) => Promise<Result>;

    /** Result from a staging menu session. */
    export type Result =
      | { readonly kind: 'exit' }
      | { readonly kind: 'back' }
      | { readonly kind: 'staged'; readonly dir: t.StringDir };
  }

  /** CLI help surface. */
  export namespace Help {
    /** Render CLI help text. */
    export type Run = (toolname?: string) => string;

    /** Help-only CLI result. */
    export type Result = {
      readonly kind: 'help';
      readonly text: string;
    };
  }
}
