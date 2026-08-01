import type { t } from '../common.ts';

/**
 * Contracts for application identity headers and their framing rule.
 */
export declare namespace CliFormatHeader {
  /** Application-header formatting operations. */
  export type Lib = {
    /** Render the aligned identity row and optional horizontal rule. */
    readonly rows: (options: Options) => readonly string[];
  };

  /** Application-header formatting requirements. */
  export type Options = {
    /** Optional package-backed title and version defaults. */
    pkg?: t.Pkg;
    /** Explicit display width; omit to use canonical terminal/fallback width policy. */
    width?: number;
    /** Generated-title, metadata, separator, version, and default rule color. */
    tone?: t.AnsiColor.Name;
    /** Caller-rendered left identity; defaults to `pkg.name`, then `Untitled`. */
    title?: string;
    /** Optional metadata rendered before the version. */
    detail?: string;
    /** `undefined` uses `pkg?.version`, a string overrides it, and `false` omits it. */
    version?: string | false;
    /** Horizontal-rule override; `false` omits the rule. */
    hr?: false | {
      /** Rule color override; defaults to `tone`. */
      color?: t.CliFormat.Hr.Color;
      /** Existing rule weight passed through to `Cli.Fmt.hr`. */
      weight?: t.CliFormat.Hr.Weight;
    };
  };
}
