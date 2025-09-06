import type * as Y from 'yaml';
import type { t } from './common.ts';

export type * from './t.Path.ts';
export type * from './t.Syncer.ts';

/** The primitives scalars possible from YAML */
export type YamPrimitives = null | string | number | boolean;
export type YamlAst = Y.Document.Parsed;

/**
 * Helpers for working with YAML.
 */
export type YamlLib = Readonly<{
  /** YAML flag helpers. */
  Is: YamlIsLib;

  /** Parse YAML to a plain JS value (fast). */
  parse<T>(input?: t.StringYaml): YamlParseResponse<T>;

  /** Parse YAML and keep the full `Document` (ranges, comments, errors). */
  parseAst(src: t.StringYaml): t.YamlAst;

  /** Creates a new parse-syncer. */
  syncer: t.YamlSyncLib['create'];
  Syncer: t.YamlSyncLib;

  /** YAML path helpers. */
  Path: t.YamlPathLib;
  path: t.YamlPathLib['create'];
}>;

/**
 * YAML related flags.
 */
export type YamlIsLib = {
  /** Determine if the given value is a YAML parse error object. */
  parseError(input?: unknown): boolean;
};

/** Response from the `Yaml.parse` method. */
export type YamlParseResponse<T> = {
  readonly data?: T;
  readonly error?: t.StdError;
};
