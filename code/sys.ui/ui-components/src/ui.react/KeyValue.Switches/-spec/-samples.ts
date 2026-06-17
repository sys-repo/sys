import { type t } from './common.ts';

export type SampleKind = 'basic' | 'mixed';
export type SampleValues = Record<string, boolean>;

type SampleItem = Omit<t.KeyValueSwitches.Item, 'value' | 'onToggle'>;
type ToggleHandler = (id: string, next: boolean) => void;
type SampleOptions = { values?: SampleValues; onToggle?: ToggleHandler };

const defaultValues = {
  capabilities: true,
  events: false,
  disabled: true,
} satisfies SampleValues;

const descriptors = {
  basic: [{ id: 'capabilities' }, { id: 'events' }],
  mixed: [
    { id: 'capabilities', label: 'custom label' },
    { id: 'disabled', label: 'disabled middle row', enabled: false },
    { id: 'events', tooltip: 'event stream visibility', switch: { height: 18, width: 34 } },
  ],
} satisfies Record<SampleKind, readonly SampleItem[]>;

/** Spec/debug sample rows. */
export const SAMPLE = {
  defaultValues,

  items(sample?: SampleKind, options: SampleOptions = {}): t.KeyValueSwitches.Item[] {
    const kind = sample ?? 'basic';
    const values: SampleValues = { ...defaultValues, ...options.values };
    const onToggle = options.onToggle;

    return descriptors[kind].map((item) => {
      const row: t.KeyValueSwitches.Item = { ...item, value: values[item.id] ?? false };
      if (onToggle) row.onToggle = (next) => onToggle(item.id, next);
      return row;
    });
  },
} as const;
