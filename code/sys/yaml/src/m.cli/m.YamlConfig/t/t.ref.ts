import type { t } from '../common.ts';

/** Resolved YAML config selector. */
export type YamlConfigRef = {
  /** Whether the input was interpreted as a bare config name or explicit path. */
  readonly kind: 'name' | 'path';

  /** Original config selector text. */
  readonly input: string;

  /** Resolved config path. Bare names map into the configured directory. */
  readonly path: t.StringPath;

  /** Config name derived from the selector. */
  readonly name: string;
};

/** YAML config selector resolution input. */
export type YamlConfigRefResolveInput = {
  /** Config selector: bare name or explicit YAML path. */
  readonly value: unknown;

  /** Directory used when `value` is a bare config name. */
  readonly dir: t.StringDir;

  /** File extension appended to bare names. Defaults to `.yaml`. */
  readonly ext?: string;

  /** Expand `~/` path-like selectors via `Fs.resolve(..., { expandTilde: true })`. */
  readonly expandTilde?: boolean;

  /** Label used in errors. Defaults to `config`. */
  readonly label?: string;

  /** Error message prefix. Defaults to `YamlConfig.Ref`. */
  readonly errorPrefix?: string;
};

/** Config selector resolution API. */
export type YamlConfigRefLib = {
  /** Resolve a `<name|path>` config selector. */
  resolve(input: YamlConfigRefResolveInput): YamlConfigRef;
};
