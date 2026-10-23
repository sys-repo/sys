import type { t } from '../common.ts';

type O = Record<string, unknown>;

/**
 * Generate a dynamic value.
 */
export type ValueHandler = <V, State extends O>(events: t.DevEvents) => t.DynamicValue<V, State>;

/**
 * Dynamic value.
 *    Used within the definitions of [DevTools] implementations
 *    when the value needs to be re-calculated upon state/prop updates.
 */
export type DynamicValue<V, State extends O> = {
  readonly current?: V;
  readonly disposed: boolean;
  dispose(): void;
  redraw(): void;
  handler(input: V | t.DevValueHandler<V, State>): DynamicValue<V, State>;
  subscribe(fn: (e: { value: V }) => void): () => boolean;
};
