import type { t } from './common.ts';

/**
 * The value of a `data-component="<value>"` attribute.
 */
export type ComponentDataAttribute = string;

/**
 * Helpers for working with the browser DOM ("document object model").
 */
export type DomLib = {
  readonly Event: DomEventLib;
};

/**
 * Helpers for working with DOM events.
 */
export type DomEventLib = {
  isWithin(event: Event, match: ComponentDataAttribute | DomWalkFilter): boolean;
};

/**
 * Function used in walking the DOM tree.
 */
export type DomWalkFilter = (e: DomWalkFilterArgs) => void;
export type DomWalkFilterArgs = { element: Element };
