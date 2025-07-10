import type { t } from './common.ts';
export type * from './t.sync.ts';

/** The primitives scalars possible from YAML */
export type YamPrimitives = null | string | number | boolean;

/**
 * Helpers for working with YAML.
 */
export type YamlLib = {
  readonly Is: YamlIsLib;

  /**
   * Safely parse YAML.
   */
  parse<T>(input?: string): YamlParseResponse<T>;

  /**
   * Creates a new parse-syncer.
   */
  syncer<T = unknown>(
    doc: t.ImmutableRef | { source: t.ImmutableRef; target?: t.ImmutableRef },
    path: t.ObjectPath | { source: t.ObjectPath; target?: t.ObjectPath | null },
    options?: { dispose$?: t.UntilInput; debounce?: t.Msecs },
  ): t.YamlSyncParser<T>;
};

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
