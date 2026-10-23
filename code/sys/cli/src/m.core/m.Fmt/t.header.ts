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

  /** Truthful package metadata or a presentation-only application identity rooted in that package. */
  export type PackageIdentity =
    | t.Pkg
    | {
      /** Truthful package metadata supplying the root name and default version. */
      readonly root: t.Pkg;
      /** Plain relative subpath normalized for presentation by the canonical package parser. */
      readonly subpath: string;
    };

  /** Application-header formatting requirements. */
  export type Options = {
    /** Optional package-backed identity and version defaults. */
    pkg?: PackageIdentity;
    /** Explicit display width; omit to use canonical terminal/fallback width policy. */
    width?: number;
    /** Generated or plain custom title, metadata, separator, version, and default rule color. */
    tone?: t.AnsiColor.Name;
    /** Plain left identity inherits an explicit tone; ANSI-rendered title is preserved. */
    title?: string;
    /** Optional metadata rendered before the version. */
    detail?: string;
    /** `undefined` uses the package root version, a string overrides it, and `false` omits it. */
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
