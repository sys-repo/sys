import type * as Y from 'yaml';
import type { t } from './common.ts';

export type * from './t.Diagnostic.ts';
export type * from './t.Is.ts';
export type * from './t.Path.ts';
export type * from './t.Range.ts';
export type * from './t.Syncer.ts';
export type * from './t.Value.ts';

/**
 * Helpers for working with YAML.
 */
export type YamlLib = {
  /** YAML flag helpers. */
  readonly Is: t.YamlIsLib;
  /** Helpers for working with YAML source ranges in byte/character offsets. */
  readonly Range: t.YamlRangeLib;
  /** Helpers for constructing YAML parser-style errors. */
  readonly Error: t.YamlErrorLib;
  /** Helpers for normalizing YAML parser errors into standard diagnostics. */
  readonly Diagnostic: t.YamlDiagnosticLib;

  /** Parse YAML to a plain JS value (fast). */
  parse<T>(src?: t.StringYaml): YamlParseResult<T>;
  /** Parse YAML and keep the full `Document` (ranges, comments, errors). */
  parseAst(src?: t.StringYaml): t.YamlAst;

  /** Stringify a plain JS value into YAML. */
  stringify<T>(value: T, options?: t.YamlStringifyOptions): t.YamlStringifyResult;

  /** Safe conversion — replaces direct .toJS() calls. */
  readonly toJS: t.YamlToJs;

  /** Creates a new parse-syncer. */
  readonly Syncer: t.YamlSyncLib;
  readonly syncer: t.YamlSyncLib['make'];

  /** YAML path helpers. */
  readonly Path: t.YamlPathLib;
  readonly path: t.YamlPathLib['make'];

  /**
   * Walk the full YAML AST (Document + nodes) with a visitor,
   * using logical object-path semantics (parallel to Obj.walk).
   */
  readonly walk: t.YamlAstWalk;
};

/** Generic result arms (mutually exclusive). */
export type YamlOk<T> = { readonly error?: undefined; readonly data: T };
export type YamlErr<E> = { readonly error: E; readonly data?: undefined };

/** YAML-specific results (align with npm:yaml semantics). */
export type YamlParseResult<T> = YamlOk<T | null> | YamlErr<t.StdError>; // yaml.parse('') → null (Ok)

/**
 * Result of stringifying to YAML.
 */
export type YamlStringifyResult = YamlOk<t.StringYaml> | YamlErr<t.StdError>;

/** Options for the `Yaml.stringify` method (direct alias of `yaml.ToStringOptions`). */
export type YamlStringifyOptions = Y.ToStringOptions;
