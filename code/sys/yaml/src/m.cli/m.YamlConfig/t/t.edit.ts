import type { t } from '../common.ts';

/** Context supplied to an owner config mutation. */
export type YamlConfigEditContext = {
  /** Absolute config path resolved from `cwd` and the caller's config input. */
  readonly path: t.StringPath;
  /** True when the config did not exist before the edit transaction. */
  readonly created: boolean;
};

/** Owner mutation output. */
export type YamlConfigEditMutation<TDoc, TChange> = {
  /** Next document state after applying the owner mutation. */
  readonly doc: TDoc;
  /** Whether the transaction should persist the next document. */
  readonly changed: boolean;
  /** Owner-defined structured change payload for result formatting. */
  readonly change: TChange;
};

/** Generic YAML owner-config edit input. */
export type YamlConfigEditInput<TDoc, TChange> = {
  /** Base directory for resolving relative config paths. */
  readonly cwd: t.StringDir;
  /** Config path, usually from `--config`. */
  readonly config: string;
  /** Preview only; validate but do not write. */
  readonly dryRun?: boolean;
  /** Initial document for missing configs. */
  readonly initial: () => TDoc | Promise<TDoc>;
  /** Load and validate an existing config document. */
  readonly load: (path: t.StringPath) => TDoc | Promise<TDoc>;
  /** Apply the owner-specific deterministic mutation. */
  readonly mutate: (
    doc: TDoc,
    context: YamlConfigEditContext,
  ) => YamlConfigEditMutation<TDoc, TChange> | Promise<YamlConfigEditMutation<TDoc, TChange>>;
  /** Serialize the generated document. */
  readonly stringify: (doc: TDoc) => string;
  /** Validate generated YAML text before dry-run/write completes. */
  readonly validateText: (text: string, path: t.StringPath) => void | Promise<void>;
};

/** Generic YAML owner-config edit result. */
export type YamlConfigEditResult<TChange> = {
  /** Transaction outcome. */
  readonly kind: 'written' | 'dry-run' | 'unchanged';
  /** Absolute config path. */
  readonly path: t.StringPath;
  /** True when the config did not exist before the edit transaction. */
  readonly created: boolean;
  /** Owner-defined structured change payload. */
  readonly change: TChange;
};

/** Owner-config edit transaction API. */
export type YamlConfigEditLib = {
  /** Run a load/create → mutate → validate → dry-run/write owner-config transaction. */
  update<TDoc, TChange>(
    input: YamlConfigEditInput<TDoc, TChange>,
  ): Promise<YamlConfigEditResult<TChange>>;
};
