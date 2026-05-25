export type CliTerminalStream = 'stdin' | 'stdout' | 'stderr';

/** Predicate helpers for CLI runtime capabilities. */
export type CliIsLib = {
  /** True when the named standard stream is attached to a terminal. */
  readonly terminal: (stream: CliTerminalStream) => boolean;

  /** True when stdin and stdout are both attached to terminals. */
  readonly interactive: () => boolean;
};
