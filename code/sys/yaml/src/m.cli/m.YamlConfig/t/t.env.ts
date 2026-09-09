import type { t } from '../common.ts';

/** Dotenv-backed YAML config env-ref types. */
export namespace YamlConfigEnv {
  /** `.env` file lookup strategy. */
  export type Search = 'cwd' | 'upward';

  /** Dotenv-backed AST env-ref resolver API. */
  export type Lib = {
    /** Resolve whole-scalar `${env:NAME}` references using loaded config environment values. */
    resolveAst(ast: t.Yaml.Ast, options: Resolve.Options): Promise<Resolve.Result>;
  };

  /** Env-ref resolution types. */
  export namespace Resolve {
    /** Resolver options for dotenv-backed YAML env-ref resolution. */
    export type Options = {
      /** Base directory for loading `.env` files. */
      readonly cwd: t.StringDir;
      /** `.env` file lookup strategy. Defaults to `'upward'`. */
      readonly search?: Search;
    };

    /** Result of resolving env refs in a parsed YAML AST. */
    export type Result = t.Yaml.EnvRef.Resolve.Result;
  }
}
