import type * as Y from 'yaml';
import type { t } from './common.ts';
export type * from './t.sync.ts';

type NodeOrNull = Y.Node | null | undefined;

/** The primitives scalars possible from YAML */
export type YamPrimitives = null | string | number | boolean;

/**
 * Helpers for working with YAML.
 */
export type YamlLib = Readonly<{
  Is: YamlIsLib;

  /** Parse YAML to a plain JS value (fast). */
  parse<T>(input?: string): YamlParseResponse<T>;

  /** Parse YAML and keep the full `Document` (ranges, comments, errors). */
  parseDocument(src: string): Y.Document.Parsed;

  /** Creates a new parse-syncer. */
  syncer: t.YamlSyncLib['create'];
  Syncer: t.YamlSyncLib;

  /**
   * Find the deepest node whose range encloses `offset`
   * and return the logical object path leading to it.
   */
  pathAtOffset(node: NodeOrNull, offset: t.Index, path?: t.ObjectPath): t.ObjectPath;
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
