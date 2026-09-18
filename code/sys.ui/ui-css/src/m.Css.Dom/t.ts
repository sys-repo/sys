import type { t } from './common.ts';
import type * as TContainer from './t.ctx.ts';

/**
 * Browser DOM stylesheet contracts.
 */
export declare namespace CssDom {
  /**
   * Runtime library surface.
   */
  export type Lib = {
    readonly PseudoClass: PseudoClass.Lib;

    /** Factory for a DOM <style> stylesheet element (singleton instances). */
    stylesheet(options?: StylesheetOptions | t.StringId): Stylesheet;

    /** Convert a {style} props object to a CSS string. */
    toString: t.Style.Lib['toString'];
  };

  /** Options passed to the `Style.Dom.stylesheet` method. */
  export type StylesheetOptions = { instance?: t.StringId; classPrefix?: string };

  /** A <style> DOM element used to store and manage generated CSS classes. */
  export type Stylesheet = {
    readonly id: t.StringId;

    /** Inserts CSS style rules into the stylesheet. */
    rule(
      selector: string,
      style: t.Style.Value | t.Style.Value[],
      options?: RuleOptions,
    ): InsertedRule[];

    /** Rules API. */
    readonly rules: Rules;

    /** Retrieve the singleton instance of the classes API with the given classname prefix. */
    classes(prefix?: string): Classes;

    /** Retrieve the singleton instance of an @container API. */
    container(condition: string): Container.Block;
    container(name: string, condition: string): Container.Block;
  };

  /** API for inserting CSS class-styles into a DOM stylesheet. */
  export type Classes = {
    /** The root prefix applied to generated class-names: "<prefix>-<hash>". */
    readonly prefix: string;

    /** List of CSS class-names that have been inserted into the DOM. */
    readonly names: Readonly<string[]>;

    /** Generate a class name and insert the given style as a cached CSS rule. */
    add(style: t.Style.Value, options?: { hx?: number }): string;
  };

  /** API for inserting CSS rules into a DOM stylesheet. */
  export type Rules = {
    /** The total number of inserted rules. */
    readonly length: number;

    /** List of CSS rules that have been inserted into the DOM. */
    readonly items: Readonly<InsertedRule[]>;

    /** Inserts generic CSS style rules into the stylesheet. */
    add(
      selector: string,
      style: t.Style.Value | t.Style.Value[],
      options?: RuleOptions,
    ): InsertedRule[];
  };

  /** Options passed to the rule insertion method. */
  export type RuleOptions = { context?: string };

  /** Receipt of a rule inserted into the DOM. */
  export type InsertedRule = {
    readonly selector: string;
    readonly style: t.Style.Props;
    readonly rule: string;
  };

  /**
   * CSS @container contracts.
   */
  export namespace Container {
    /** Represents a CSS/DOM context-block that encapsulates @container rules. */
    export type Block = TContainer.Block;

    /** Flags indicating the kind of string to export from the `toString` method. */
    export type ToStringKind = TContainer.ToStringKind;
  }

  /**
   * CSS pseudo-class contracts.
   */
  export namespace PseudoClass {
    /** CSS pseudo-class runtime library surface. */
    export type Lib = {
      level3: ReadonlySet<Level3>;
      level4: ReadonlySet<Level4>;
      all: ReadonlySet<Name>;
      isClass(input: unknown): input is Name;
    };

    /** CSS Selectors Level 3 pseudo-classes. */
    export type Level3 =
      | ':hover'
      | ':active'
      | ':focus'
      | ':visited'
      | ':link'
      | ':target'
      | ':checked'
      | ':disabled'
      | ':enabled'
      | ':first-child'
      | ':last-child'
      | ':only-child'
      | ':nth-child'
      | ':nth-last-child'
      | ':first-of-type'
      | ':last-of-type'
      | ':only-of-type'
      | ':empty'
      | ':root'
      | ':not'
      | ':lang';

    /** CSS Selectors Level 4 pseudo-classes. */
    export type Level4 =
      | ':focus-visible'
      | ':focus-within'
      | ':any-link'
      | ':default'
      | ':indeterminate'
      | ':in-range'
      | ':invalid'
      | ':optional'
      | ':out-of-range'
      | ':placeholder-shown'
      | '::placeholder'
      | ':read-only'
      | ':read-write'
      | ':required'
      | ':valid'
      | ':user-invalid'
      | ':defined'
      | ':is'
      | ':where'
      | ':has'
      | ':dir';

    /** CSS pseudo-class name. */
    export type Name = Level3 | Level4;

    /** Map of CSS pseudo-class values. */
    export type Map = { [K in Name]?: t.Style.Value };
  }
}
