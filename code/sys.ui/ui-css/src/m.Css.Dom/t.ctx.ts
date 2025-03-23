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
    /** List of inserted rules wihtin the container. */
    readonly inserted: Readonly<t.CssDomInsertedRule[]>;
    /** Inserts CSS styles with the given selector within a context-block. */
    add(selector: string, style: t.CssProps | t.CssProps[]): t.CssDomInsertedRule[];
  };

  /** String representation of the block. */
  toString(kind?: t.CssDomContainerToStringKind): string;
};

/** Flags indicating the kind of string to export from the `toString` method. */
export type CssDomContainerToStringKind = 'QueryCondition' | 'CssSelector';
