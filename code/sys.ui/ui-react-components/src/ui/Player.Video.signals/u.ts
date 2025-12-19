import { type t } from './common.ts';

/**
 * Monotonic marker for "ended happened" (native ended or crop-ended dispatch).
 */
export function bumpEndedTick(props: { readonly endedTick: t.Signal<number> }): void {
  const prev = props.endedTick.value ?? 0;
  const next = prev + 1;
  if (!Object.is(props.endedTick.value, next)) props.endedTick.value = next;
}
