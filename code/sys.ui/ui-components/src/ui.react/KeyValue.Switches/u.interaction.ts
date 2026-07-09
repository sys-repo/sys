import type { t } from './common.ts';

/** Row-local switch interaction shared by label and value-side control. */
export type SwitchRowInteraction = {
  readonly value: boolean;
  readonly enabled: boolean;
  toggle(synthetic: t.ReactMouseEvent, next?: boolean): void;
};

/** Build the single toggle action for one KeyValue.Switches row. */
export function toInteraction(
  item: t.KeyValueSwitches.Row,
  index: number,
  enabled?: boolean,
): SwitchRowInteraction {
  const value = Boolean(item.value);
  const isEnabled = (enabled ?? true) && (item.enabled ?? true) && Boolean(item.onToggle);

  return {
    value,
    enabled: isEnabled,
    toggle(synthetic, next = !value) {
      if (!isEnabled) return;
      item.onToggle?.({ current: value, next, item, index, synthetic });
    },
  };
}
