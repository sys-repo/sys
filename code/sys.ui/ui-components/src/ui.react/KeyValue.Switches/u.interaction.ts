import type { t } from './common.ts';
import { isCursorEntryClick } from '../KeyValue/m.Cursor/u/u.event.ts';

type CursorOptions = Pick<t.KeyValue.Cursor.Props, 'enabled' | 'entry'>;

type ToggleArgsInput = {
  readonly item: t.KeyValueSwitches.Row;
  readonly index: number;
  readonly enabled?: boolean;
  readonly target: t.KeyValue.Cursor.Target;
  readonly source: t.KeyValueSwitches.Item.Toggle.Source;
  readonly next?: boolean;
};

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
  cursor?: CursorOptions,
  target: t.KeyValue.Cursor.Target = { path: [item.id] },
): SwitchRowInteraction {
  const value = Boolean(item.value);
  const isEnabled = (enabled ?? true) && (item.enabled ?? true) && Boolean(item.onToggle);

  return {
    value,
    enabled: isEnabled,
    toggle(synthetic, next = !value) {
      if (!isEnabled) return;
      if (isCursorEntryIntent(synthetic, cursor)) return;
      const args = toToggleArgs({
        item,
        index,
        enabled,
        target,
        next,
        source: { kind: 'pointer', event: synthetic },
      });
      if (args) item.onToggle?.(args);
    },
  };
}

export function toToggleArgs(
  input: ToggleArgsInput,
): t.KeyValueSwitches.Item.Toggle.Args | undefined {
  const current = Boolean(input.item.value);
  const next = input.next ?? !current;
  const isEnabled = (input.enabled ?? true) && (input.item.enabled ?? true) &&
    Boolean(input.item.onToggle);
  if (!isEnabled) return undefined;

  const command: t.KeyValueSwitches.Item.Toggle.Command = {
    name: 'keyvalue-switches:toggle',
    payload: { target: input.target, next },
  };
  const synthetic = input.source.kind === 'pointer' ? input.source.event : undefined;
  return {
    current,
    next,
    item: input.item,
    index: input.index,
    command,
    source: input.source,
    synthetic,
  };
}

function isCursorEntryIntent(event: t.ReactMouseEvent, cursor?: CursorOptions): boolean {
  if (!cursor || cursor.enabled === false) return false;
  return isCursorEntryClick(event, cursor.entry);
}
