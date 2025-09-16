/**
 * Types for the YAML → Schema pipeline.
 * - Shared contracts across parse/validate stages.
 */
import type { t } from './common.ts';

/**
 * Namespace for tools that handle the pipe of YAML → Schema → Object and back again.
 */
export type YamlPipelineLib = {
  slugFromYaml: t.SlugFromYaml;
};

/**
 * Extract + structurally validate a slug located at `path` within YAML `input`.
 * - `input` may be raw YAML (string) or a pre-parsed `t.YamlAst`.
 * - Structural only (no semantic alias/props checks here).
 */
export type SlugFromYaml = (
  input: string | t.YamlAst,
  path?: t.ObjectPath | string,
) => SlugFromYamlResult;

/**
 * Result of extracting + validating a slug from YAML.
 * - Structural only (no semantic rules).
 * - Keeps parser errors and schema errors distinct.
 */
export type SlugFromYamlResult = {
  /** Overall structural check outcome. */
  readonly ok: boolean;

  /** The parsed YAML AST (hand back for editor decoration mapping). */
  readonly ast: t.YamlAst;

  /** Candidate slug value (only present when ok=true). */
  readonly slug?: unknown;

  readonly errors: {
    /** Schema structural issues (empty when ok=true). */
    readonly schema: readonly { path: t.ObjectPath; message: string }[];

    /** Parser errors reported by the YAML library. */
    readonly yaml: readonly t.YamlError[];
  };
};
