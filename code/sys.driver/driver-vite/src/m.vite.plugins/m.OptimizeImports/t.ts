import type { t } from './common.ts';

/** Type surfaces for the controlled import-optimization plugin. */
export declare namespace OptimizeImportsPlugin {
  /** Runtime surface for constructing the optimization plugin. */
  export type Lib = {
    /** Create a Vite plugin that rewrites broad imports to narrow public subpaths. */
    readonly plugin: (options?: OptionsInput) => t.VitePlugin;
  };

  /** Plugin configuration. */
  export type OptionsInput = {
    /** Explicit package rewrite rules. */
    readonly packages?: readonly PackageRule[];
  };

  /** Rewrite rules for one exact package root. */
  export type PackageRule = {
    /** Exact package root id to match, such as `@sys/ui-react-components`. */
    readonly packageId: string;
    /** Named-import rewrite rules for this package root. */
    readonly imports: readonly ImportRule[];
  };

  /** Rewrite rule for one named import. */
  export type ImportRule = {
    /** Named import to match from the package root. */
    readonly importName: string;
    /** Stable public subpath relative to `packageId`. */
    readonly subpath: string;
    /** Whether this rule applies to value imports, type imports, or both. */
    readonly kind?: ImportRuleKind;
  };

  /** Import-kind applicability for a rewrite rule. */
  export type ImportRuleKind =
    | 'value'
    | 'type'
    | 'both';
}
