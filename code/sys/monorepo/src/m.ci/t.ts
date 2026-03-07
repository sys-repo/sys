import type { t } from './common.ts';

/**
 * @module
 * Continuous-integration module surface for monorepo tooling.
 */
export namespace MonorepoCi {
  export type WorkflowEntries = Readonly<Record<string, string>>;

  export type Lib = {
    readonly Jsr: Jsr.Lib;
    readonly Build: Build.Lib;
  };

  /**
   * JSR publish workflow generation.
   */
  export namespace Jsr {
    export type Lib = {
      text(args: TextArgs): Promise<string>;
      write(args: WriteArgs): Promise<WriteResult>;
    };
    export type TextArgs = {
      readonly cwd?: t.StringDir;
      readonly paths: readonly t.StringPath[];
      readonly branches?: readonly string[];
      readonly env?: WorkflowEntries;
    };
    export type WriteArgs = TextArgs & { readonly target: t.StringPath };
    export type WriteResult = {
      readonly target: t.StringPath;
      readonly yaml: string;
      readonly count: number;
    };
  }

  /**
   * Build workflow generation for modules with a `deno task build` surface.
   */
  export namespace Build {
    export type Lib = {
      text(args: Args): Promise<string>;
      write(args: WriteArgs): Promise<WriteResult>;
    };
    export type Args = {
      readonly cwd?: t.StringDir;
      readonly paths: readonly t.StringPath[];
      readonly branches?: readonly string[];
      readonly env?: WorkflowEntries;
    };
    export type WriteArgs = Args & { readonly target: t.StringPath };
    export type WriteResult = {
      readonly target: t.StringPath;
      readonly yaml: string;
      readonly count: number;
    };
  }
}
