import type { RefObject } from 'react';
import type { t } from './common.ts';

type E = HTMLElement;
type Div = HTMLDivElement;

/**
 * Hook: information about a mouse click operations
 */
export type UseClickHook<T extends E = Div> = (input: t.UseClickInput<T>) => ClickHook<T>;
/** Loose input passed to the UseClick hook. */
export type UseClickInput<T extends E> = t.ClickHookProps<T> | t.DomMouseEventHandler;

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
  ref?: RefObject<T>;
  stage?: t.UseClickStage;
  callback?: t.DomMouseEventHandler;
};
export type UseClickStage = 'down' | 'up';
