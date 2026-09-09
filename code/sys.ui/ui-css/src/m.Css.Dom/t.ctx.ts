import type { t } from './common.ts';

/** Represents a CSS/DOM context-block that encapsulates @container rules. */
export type Block = {
  /** The type of the context-block. */
  readonly kind: '@container';

  /** The conditional rules for the context block, eg "min-width: 700px". */
  readonly condition: string;

  /** The name of the container. */
  readonly name?: string;

  /** Raw rule API. */
  readonly rules: {
    /** The total number of inserted rules. */
    readonly length: number;
    /** List of inserted rules within the container. */
    readonly items: Readonly<t.CssDom.InsertedRule[]>;
    /** Inserts CSS styles with the given selector within a context-block. */
    add(
      selector: t.StringCssSelector,
      style: t.Style.Value | t.Style.Value[],
    ): t.CssDom.InsertedRule[];
  };

  /** String representation of the block. */
  toString(kind?: ToStringKind): string;

  /** Creates a scoped sub-block prefixing the child rules with the given selector. */
  scope(selector: t.StringCssSelector): Block;

  /** The list of CSS selectors that represent the scope this container is within. */
  readonly scoped: Readonly<t.StringCssSelector[]>;
};

/** Flags indicating the kind of string to export from the `toString` method. */
export type ToStringKind = 'QueryCondition' | 'CssSelector';
