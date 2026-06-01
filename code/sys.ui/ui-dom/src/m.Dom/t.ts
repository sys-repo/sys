import type { t } from './common.ts';

/**
 * Helpers for working with the browser DOM (document object model).
 */
export declare namespace Dom {
  /** DOM helper library surface. */
  export type Lib = {
    readonly Event: Event.Lib;
    readonly UserHas: t.UserHas.Lib;
  };

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
