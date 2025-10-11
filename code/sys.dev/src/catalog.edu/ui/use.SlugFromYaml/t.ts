import type { t } from './common.ts';

/**
 * React-style hook for deriving a typed `Slug` object from YAML editor state.
 * - Parses the current YAML AST.
 * - Extracts the slug object at the given `path`.
 * - Returns validation diagnostics and revision tracking info.
 */
export type UseSlugFromYaml = (args: {
  /** Current YAML editor snapshot (with AST + revision). */
  readonly yaml?: t.EditorYaml;
  /** Optional object path within the YAML to extract from (array or pointer string). */
  readonly path?: t.ObjectPath | string;
}) => UseSlugFromYamlResult;

/**
 * Result returned by {@link UseSlugFromYaml}.
 * Includes validation outcome, revision number, parsed result, and diagnostics.
 */
export type UseSlugFromYamlResult = {
  /** True when the slug parsed successfully and no diagnostics were emitted. */
  readonly ok: boolean;
  /** Revision number from the current editor state. */
  readonly rev: number;
  /** Parsed and validated slug (when successful). */
  readonly result?: t.SlugFromYamlResult;
  /** Normalized diagnostics (semantic + structural) from the YAML pipeline. */
  readonly diagnostics: t.Yaml.Diagnostic[];
};
