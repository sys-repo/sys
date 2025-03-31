import type { MouseEventHandler, RefObject } from 'react';
import type { t } from './common.ts';

type E = HTMLElement;
type Div = HTMLDivElement;
type MouseCallback = (e: MouseEvent) => void;

/**
 * Hook: information about a mouse click operations
 */
export type UseClickHook<T extends E = Div> = (input: t.UseClickInput<T>) => ClickHook<T>;
/** Input passed to the UseClick hook. */
export type UseClickInput<T extends E> = t.ClickHookProps<T> | MouseCallback;

/**
 * Hook: information about a mouse click operations
 */
export type ClickHook<T extends E> = {
  readonly ref: RefObject<T>;
  readonly stage: t.UseClickStage;
};

/**
 * Properties passed to the `UseClick` hook.
 */
export type ClickHookProps<T extends E> = {
  stage?: t.UseClickStage;
  ref?: RefObject<T>;
  callback?: MouseCallback;
};
export type UseClickStage = 'down' | 'up';
