import type { t } from './common.ts';
import { isFocusEntryClick } from '../KeyValue/m.Focus/u.event.ts';

type FocusOptions = Pick<t.KeyValue.Focus.Props, 'enabled' | 'entry'>;

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
  focus?: FocusOptions,
): SwitchRowInteraction {
  const value = Boolean(item.value);
  const isEnabled = (enabled ?? true) && (item.enabled ?? true) && Boolean(item.onToggle);

  return {
    value,
    enabled: isEnabled,
    toggle(synthetic, next = !value) {
      if (!isEnabled) return;
      if (isFocusEntryIntent(synthetic, focus)) return;
      item.onToggle?.({ current: value, next, item, index, synthetic });
    },
  };
}

function isFocusEntryIntent(event: t.ReactMouseEvent, focus?: FocusOptions): boolean {
  if (!focus || focus.enabled === false) return false;
  return isFocusEntryClick(event, focus.entry);
}

