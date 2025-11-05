import type * as Y from 'yaml';
import type { t } from './common.ts';

/**
 * Parsed YAML Abstract Syntax Tree (AST).
 * Note: `.toJS()` intentionally omitted to force usage of safe Yaml.toJS().
 */
export type YamlAst = Omit<Y.Document.Parsed, 'toJS'>;

/**
 * Safely converts a parsed YAML AST into a JavaScript value.
 * Always returns a normalized result object instead of throwing.
 */
export type YamlToJs = <T = unknown>(doc: t.YamlAst) => YamlToJsResult<T>;
export type YamlToJsResult<T = unknown> = {
  /** True if conversion succeeded without errors. */ readonly ok: boolean;

  /** Parsed JavaScript value, present only if `ok` is true. */
  readonly value?: T;

  /** Normalized YAML diagnostics (e.g., unresolved alias, parser error). */
  readonly errors: readonly t.YamlDiagnostic[];
};
