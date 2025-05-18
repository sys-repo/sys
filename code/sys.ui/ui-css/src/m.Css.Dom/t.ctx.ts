import type { t } from './common.ts';

/**
 * Represents a CSS/DOM context-block that encapsulates a set of CSS rules
 * applied within a @container context.
 */
export type CssDomContainerBlock = {
  /** The type of the context-block. */
  readonly kind: '@container';

  /** The conditional rules for the context block, eg "min-width: 700px". */
  readonly condition: string;

  /** The name of the container (empty if unnamed)/ */
  readonly name?: string;

  /** Raw rule API. */
  readonly rules: {
    /** The total number of inserted rules. */
    readonly length: number;
    /** List of inserted rules wihtin the container. */
    readonly items: Readonly<t.CssDomInsertedRule[]>;
    /** Inserts CSS styles with the given selector within a context-block. */
    add(selector: t.StringCssSelector, style: t.CssValue | t.CssValue[]): t.CssDomInsertedRule[];
  };

  /** String representation of the block. */
  toString(kind?: t.CssDomContainerToStringKind): string;

  /** Creates a scoped sub-block prefixing the child rules with the given selector. */
  scope(selector: t.StringCssSelector): CssDomContainerBlock;
  /** The list of CSS selectors that represent the scope this container is within. */
  readonly scoped: Readonly<t.StringCssSelector[]>;
};

/** Flags indicating the kind of string to export from the `toString` method. */
export type CssDomContainerToStringKind = 'QueryCondition' | 'CssSelector';
