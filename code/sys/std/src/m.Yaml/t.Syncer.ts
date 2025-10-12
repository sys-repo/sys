import type { t } from './common.ts';

/**
 * Namespace of reactive YAML synchronization utilities.
 *
 * A "syncer" observes a live document reference (`ImmutableRef`)
 * containing YAML source text, automatically:
 *   • parsing changes into AST + JS value
 *   • propagating parsed results into a target document path
 *   • emitting revisioned updates and diagnostics
 *
 * Typical use:
 * ```ts
 * const syncer = Yaml.Syncer.make({
 *   doc: { source, target },
 *   path: ['foo', 'bar'], // YAML string location within source doc
 *   debounce: 50,         // (optional)
 * });
 *
 * syncer.$.subscribe(e => console.log(e.value)); // parsed output
 * ```
 */
export type YamlSyncLib = {
  /**
   * Creates a new reactive YAML parser/syncer.
   *
   * The syncer watches the `source` path for YAML text changes and
   * writes the parsed JS value into the `target` path.
   * If the source and target refer to the same document, the
   * target defaults to `source[last] + '.parsed'`.
   */
  make<T = unknown>(args: t.YamlSyncArgsInput, until?: t.UntilInput): t.YamlSyncParser<T>;
};

/** Arguments passed to the `Yaml.Syncer.create` method. */
export type YamlSyncArgsInput = {
  doc: t.ImmutableRef | { source: t.ImmutableRef; target?: t.ImmutableRef };
  path: t.ObjectPath | { source: t.ObjectPath; target?: t.ObjectPath | null };
  debounce?: t.Msecs;
};

/** Normalized input arguments into usable values. */
export type YamlSyncArgs = {
  readonly life: t.Lifecycle;
  readonly doc: t.YamlSyncParserDocs;
  readonly path: t.YamlSyncParserPaths;
  readonly debounce: t.Msecs;
};

/**
 * Monitors an observable document and parses a YAML
 * string and persists it to a path on change.
 */
export type YamlSyncParser<T = unknown> = t.Lifecycle & {
  readonly ok: boolean;
  readonly $: t.Observable<t.YamlSyncParsed<T>>;
  readonly path: YamlSyncParserPaths;
  readonly doc: YamlSyncParserDocs;
  readonly current: t.YamlSyncParsed<T>;
  readonly errors: t.YamlError[];
};

/** Source and target documents being synced (may be the same document). */
export type YamlSyncParserDocs = {
  readonly source: t.ImmutableRef;
  readonly target: t.ImmutableRef;
};

/** Source and target paths. */
export type YamlSyncParserPaths = {
  readonly source: t.ObjectPath | null;
  readonly target: t.ObjectPath | null;
};

/**
 * Result of a YAML parse operation.
 * Represents the current state of the parsed document.
 */
export type YamlSyncParsed<T = unknown> = {
  /** Returns true if no error is present and the error list is empty. */
  readonly ok: boolean;

  /** Monotonic revision counter. */
  readonly rev: number;

  /** The diff operations. */
  readonly ops: t.ObjDiffOp[];

  /** The source/target paths used by the parser. */
  readonly path: t.YamlSyncParserPaths;

  /** The raw YAML text before and after parsing. */
  readonly text: { readonly before: t.StringYaml; readonly after: t.StringYaml };

  /** The parsed YAML output value. */
  readonly value?: t.YamlValue<T>;

  /** Parsed AST for structural introspection and navigation. */
  readonly ast?: t.Yaml.Ast;

  /** Standard error (super set of parse errors). */
  readonly error?: t.StdError;

  /** The YAML parse errors, with source-map pointers back into the raw YAML text. */
  readonly errors: t.YamlError[];
};
