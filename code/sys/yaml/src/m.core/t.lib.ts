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
  /** Helpers for normalizing YAML parser errors into standard diagnostics. */
  readonly Diagnostic: t.YamlDiagnosticLib;

  /** Helpers for working with YAML source ranges in byte/character offsets. */
  readonly Range: t.YamlRangeLib;

  /** Parse YAML to a plain JS value (fast). */
  parse<T>(src?: t.StringYaml): YamlParseResult<T>;
  /** Parse YAML and keep the full `Document` (ranges, comments, errors). */
  parseAst(src: t.StringYaml): t.YamlAst;

  /** Creates a new parse-syncer. */
  readonly Syncer: t.YamlSyncLib;
  readonly syncer: t.YamlSyncLib['make'];

  /** YAML path helpers. */
  readonly Path: t.YamlPathLib;
  readonly path: t.YamlPathLib['make'];
};

/** Generic result arms (mutually exclusive). */
export type YamlOk<T> = { readonly error?: undefined; readonly data: T };
export type YamlErr<E> = { readonly error: E; readonly data?: undefined };

/** YAML-specific results (align with npm:yaml semantics). */
export type YamlParseResult<T> = YamlOk<T | null> | YamlErr<t.StdError>; // yaml.parse('') → null (Ok)
