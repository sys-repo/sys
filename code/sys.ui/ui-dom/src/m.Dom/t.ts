import type { t } from './common.ts';

/**
 * Helpers for working with the browser DOM (document object model).
 */
export declare namespace Dom {
  /** DOM helper library surface. */
  export type Lib = {
    readonly Event: Event.Lib;
    readonly Interactive: Interactive.Lib;
    readonly UserHas: t.UserHas.Lib;
  };

  /**
   * Conventional interactive/focusable DOM descendant helper contracts.
   */
  export namespace Interactive {
    /** Options for interactive descendant queries. */
    export type Options = {
      /** Element to ignore as an interactive match. Descendants may still match. */
      readonly ignore?: Element | null;
    };

    /** Helpers for identifying conventional interactive/focusable DOM descendants. */
    export type Lib = {
      /** Closest conventional interactive/focusable element at or above the target. */
      closest(target: EventTarget | null | undefined, options?: Options): Element | undefined;
      /** Boolean predicates for conventional interactive/focusable DOM targets. */
      readonly Is: Is.Lib;
    };

    /** Boolean predicates for conventional interactive/focusable DOM targets. */
    export namespace Is {
      /** Predicate helpers for conventional interactive/focusable DOM targets. */
      export type Lib = {
        /** True when the target is at/inside a conventional interactive/focusable element. */
        at(target: EventTarget | null | undefined, options?: Options): boolean;
        /**
         * True when the target is at/inside a conventional interactive/focusable element contained
         * by the boundary.
         */
        within(
          target: EventTarget | null | undefined,
          boundary: Element,
          options?: Options,
        ): boolean;
      };
    }
  }

  /**
   * DOM event helper contracts.
   */
  export namespace Event {
    /** Helpers for working with DOM events. */
    export type Lib = {
      isWithin(event: globalThis.Event, match: Component.DataAttribute | Walk.Filter): boolean;
    };
  }

  /**
   * DOM component attribute contracts.
   */
  export namespace Component {
    /** The value of a `data-component="<value>"` attribute. */
    export type DataAttribute = string;
  }

  /**
   * DOM walking contracts.
   */
  export namespace Walk {
    /** Function used while walking the DOM tree. */
    export type Filter = (e: Args) => boolean;

    /** Arguments passed to a DOM walk filter. */
    export type Args = { readonly element: Element };
  }
}
