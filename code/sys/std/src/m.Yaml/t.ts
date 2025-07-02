import type { t } from './common.ts';

/**
 * Helpers for working with YAML.
 */
export type YamlLib = {
  /**
   * Safely parse YAML.
   */
  parse<T>(input?: string): YamlParseResponse<T>;

  /**
   * Creates a new parse-syncer.
   */
  syncer<T = unknown>(
    doc: t.ImmutableRef | { source: t.ImmutableRef; target?: t.ImmutableRef },
    path: t.ObjectPath | { source: t.ObjectPath; target?: t.ObjectPath },
    options?: { dispose$?: t.UntilInput },
  ): YamlSyncParser<T>;
};

/** Response from the `Yaml.parse` method. */
export type YamlParseResponse<T> = { readonly data?: T; readonly error?: t.StdError };

/**
 * Monitors an observable document and parses a YAML string
 * and persists it to a path on change.
 */
export type YamlSyncParser<T> = t.Lifecycle & {
  readonly ok: boolean;
  readonly $: t.Observable<t.YamlSyncParserChange<T>>;
  readonly path: YamlSyncParserPaths;
  readonly doc: YamlSyncParserDocs;
  readonly errors: t.StdError[];
};

/** Source and target docments being synced (may be the same document). */
export type YamlSyncParserDocs = {
  readonly source: t.ImmutableRef;
  readonly target: t.ImmutableRef;
};

/** Source and target paths. */
export type YamlSyncParserPaths = {
  readonly source: t.ObjectPath;
  readonly target: t.ObjectPath;
};

/** Change event fired by the sync-parser. */
export type YamlSyncParserChange<T> = {
  readonly yaml: { before: string; after: string };
  readonly parsed?: T;
  readonly error?: t.StdError;
};
