import { type t } from './common.ts';

/**
 * Monotonic marker for "ended happened"
 * (native ended or crop-ended dispatch).
 */
export function bumpEndedTick(props: { readonly endedTick: t.Signal<number> }): void {
  props.endedTick.value = props.endedTick.value + 1;
}
