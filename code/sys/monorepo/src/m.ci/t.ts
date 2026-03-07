import type { t } from './common.ts';

/**
 * @module
 * Continuous-integration module surface for monorepo tooling.
 */
export namespace MonorepoCi {
  export type Lib = {
    readonly Jsr: JsrLib;
  };

  export type JsrLib = {
    text(args: JsrArgs): Promise<string>;
    write(args: JsrWriteArgs): Promise<JsrWriteResult>;
  };

  export type JsrArgs = {
    readonly cwd?: t.StringDir;
    readonly paths: readonly t.StringPath[];
  };

  export type JsrWriteArgs = JsrArgs & {
    readonly target: t.StringPath;
  };

  export type JsrWriteResult = {
    readonly target: t.StringPath;
    readonly yaml: string;
    readonly count: number;
  };
}
