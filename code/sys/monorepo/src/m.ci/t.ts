import type { t } from './common.ts';

/**
 * @module
 * Continuous-integration module surface for monorepo tooling.
 */
export namespace MonorepoCi {
  export type Lib = {
    readonly Jsr: Jsr.Lib;
  };

  export namespace Jsr {
    export type Lib = {
      text(args: TextArgs): Promise<string>;
      write(args: WriteArgs): Promise<WriteResult>;
    };
    export type TextArgs = { readonly cwd?: t.StringDir; readonly paths: readonly t.StringPath[] };
    export type WriteArgs = TextArgs & { readonly target: t.StringPath };
    export type WriteResult = {
      readonly target: t.StringPath;
      readonly yaml: string;
      readonly count: number;
    };
  }
}
