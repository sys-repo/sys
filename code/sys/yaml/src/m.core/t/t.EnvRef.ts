import type { t } from '../common.ts';

/**
 * Whole-scalar YAML environment references.
 */
export namespace YamlEnvRef {
  /** Inspection and resolution API for whole-scalar YAML env refs. */
  export type Lib = {
    /** Inspect whole-scalar `${env:NAME}` references without resolving or mutating the AST. */
    inspectAst(ast: t.YamlAst): Inspect.Result;
    /**
     * Resolve whole-scalar `${env:NAME}` references in the supplied AST.
     * Apply substitutions only if every reference resolves successfully.
     */
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
      /** Return the value for `name`, or `undefined` when missing. Empty strings are valid by default. */
      get(name: string): string | undefined;
      /** Reject empty or whitespace-only values. Defaults to false; never trims accepted values. */
      nonEmpty?: boolean;
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
        /**
         * Missing or rejected-blank references, present only when they explain every resolution error.
         * Absence does not imply that all referenced values were available.
         * Contains reference names and paths, not resolved values.
         */
        readonly unavailable?: readonly Ref[];
      };
  }
}
