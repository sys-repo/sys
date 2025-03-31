import type { MouseEventHandler, RefObject } from 'react';
import type { t } from './common.ts';

type E = HTMLElement;
type Div = HTMLDivElement;
type M = MouseEventHandler;
type MouseCallback = (e: MouseEvent) => void;

/**
 * Hook: information about a mouse click operations
 */
export type UseClickHook<T extends E = Div> = (input: t.UseClickInput<T>) => UseClick<T>;

/**
 * Hook: Monitors for click events outside the given element.
 * Usage:
 *    Useful for clicking away from modal dialogs or popups.
 */
export type UseClickOutsideHook<T extends E = Div> = UseClickHook<T>;

/**
 * Hook: Monitors for click events within the given element.
 * Usage:
 *    Useful for clicking away from modal dialogs or popups.
 */
export type UseClickInsideHook<T extends E = Div> = UseClickHook<T>;

/**
 * Input passed to the UseClick hook.
 */
export type UseClickInput<T extends E> = t.UseClickProps<T> | MouseCallback;

/**
 * Hook: information about a mouse click operations
 */
export type UseClick<T extends E> = {
  readonly ref: RefObject<T>;
  readonly stage: t.UseClickStage;
};

/**
 * Properties passed to the `UseClick` hook.
 */
export type UseClickProps<T extends E> = {
  stage?: t.UseClickStage;
  ref?: RefObject<T>;
  callback?: MouseCallback;
};
export type UseClickStage = 'down' | 'up';
