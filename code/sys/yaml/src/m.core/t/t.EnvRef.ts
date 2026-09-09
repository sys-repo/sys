import type { t } from '../common.ts';

/**
 * Pure YAML env-ref types.
 */
export namespace YamlEnvRef {
  /** Inspection and resolution API for whole-scalar YAML env refs. */
  export type Lib = {
    /** Inspect whole-scalar `${env:NAME}` references without resolving or mutating the AST. */
    inspectAst(ast: t.YamlAst): Inspect.Result;
    /** Resolve whole-scalar `${env:NAME}` references in a parsed YAML AST. */
    resolveAst(ast: t.YamlAst, options: Resolve.Options): Resolve.Result;
  };

  /** Env reference discovered in a YAML scalar value. */
  export type Ref = {
    /** Logical object path of the scalar value. */
    readonly path: t.ObjectPath;
    /** Env var name inside `${env:NAME}`. */
    readonly name: string;
  };

  /**
   * Env-ref inspection types.
   */
  export namespace Inspect {
    /** Result of inspecting env refs without resolving values. */
    export type Result =
      | {
        readonly ok: true;
        readonly ast: t.YamlAst;
        readonly refs: readonly Ref[];
      }
      | {
        readonly ok: false;
        readonly ast: t.YamlAst;
        readonly errors: readonly t.Yaml.Error[];
        readonly refs: readonly Ref[];
      };
  }

  /**
   * Env-ref resolution types.
   */
  export namespace Resolve {
    /** Resolver options for pure YAML env-ref resolution. */
    export type Options = {
      /** Return the value for `name`, or `undefined` when missing. Empty string is a valid value. */
      get(name: string): string | undefined;
    };

    /** Result of resolving env refs in a parsed YAML AST. */
    export type Result =
      | {
        readonly ok: true;
        readonly ast: t.YamlAst;
        readonly refs: readonly Ref[];
      }
      | {
        readonly ok: false;
        readonly ast: t.YamlAst;
        readonly errors: readonly t.Yaml.Error[];
        readonly refs: readonly Ref[];
      };
  }
}
