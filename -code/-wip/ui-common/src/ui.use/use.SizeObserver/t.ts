import type { t } from './common.ts';
import type { RefObject } from 'react';

type E = HTMLElement;

/**
 * Hook
 */
export type UseSizeObserverArgs<T extends E> = {
  ref?: RefObject<T>;
  onChange?: t.UseSizeObserverChangeHandler;
};

/**
 * Events
 */
export type UseSizeObserverChangeHandler = (e: UseSizeObserverChangeHandlerArgs) => void;
export type UseSizeObserverChangeHandlerArgs = {
  ready: boolean;
  rect: t.DomRect;
  size: t.Size;
};
