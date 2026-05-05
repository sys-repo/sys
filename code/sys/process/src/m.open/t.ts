import type { t } from './common.ts';

/**
 * @module
 * Public types for detached URL and path opening helpers.
 */
/** Supported OS identifiers for command resolution. */
export type OpenOs = 'windows' | 'linux' | 'darwin';

/** OS discriminator accepted by `Open.resolveCommand`. */
export type OpenOsInput = OpenOs | (string & {});

/**
 * Open helpers for launching URLs and paths via the OS
 * default handler in a detached process.
 */
export type OpenLib = {
  /** Fire-and-forget open of a URL in the default handler. */
  readonly invokeDetached: (cwd: t.StringDir, url: t.StringUrl, opts?: OpenInvokeOptions) => void;

  /** Resolve the platform-specific command for opening a URL. */
  readonly resolveCommand: (target: t.StringUrl, os?: OpenOsInput) => OpenCommand;
};

/** Process command for opening a URL. */
export type OpenCommand = {
  readonly cmd: string;
  readonly args: readonly string[];
};

/** Options for Open.invokeDetached. */
export type OpenInvokeOptions = {
  readonly silent?: boolean;
};
