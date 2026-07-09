import React from 'react';
import { Color, css, Is, type t } from './common.ts';

export type SampleKind = 'basic' | 'mixed' | 'grouped';
export type SampleValues = Record<string, boolean>;

type SampleRow = Omit<t.KeyValueSwitches.Row, 'value' | 'onToggle'>;
type SampleGroup = Omit<t.KeyValueSwitches.Group, 'items'> & { items: SampleItem[] };
type SampleItem = SampleRow | t.KeyValue.Item.Hr | SampleGroup;
type ToggleHandler = t.KeyValueSwitches.Item.Toggle.Handler;
type SampleOptions = { values?: SampleValues; onToggle?: ToggleHandler };

const isHr = (item: t.KeyValueSwitches.Item): item is t.KeyValue.Item.Hr => {
  return Is.object(item) && 'kind' in item && item.kind === 'hr';
};

const isGroup = (item: t.KeyValueSwitches.Item): item is t.KeyValueSwitches.Group => {
  return Is.object(item) && 'kind' in item && item.kind === 'group';
};

const Styles = {
  customLabel: css({
    backgroundColor: Color.ruby(0.2),
    marginTop: 3,
    paddingBottom: 22,
  }),
};

const defaultValues = {
  alpha: true,
  bravo: false,
  charlie: true,
  custom: true,
  large: true,
  overflow: false,
  disabled: true,
  multiline: false,
  foo: true,
  primary: true,
  'nested-alpha': true,
  'nested-bravo': false,
  secondary: true,
  bar: false,
  baz: true,
} satisfies SampleValues;

const descriptors: Record<SampleKind, readonly SampleItem[]> = {
  basic: [{ id: 'alpha' }, { id: 'bravo' }, { id: 'charlie' }],
  mixed: [
    {
      id: 'custom',
      label: <div className={Styles.customLabel.class}>{'custom label element'}</div>,
    },
    {
      id: 'large',
      label: <div>{'here - look, a large switch'}</div>,
      switch: { height: 18, width: 34 },
    },
    { id: 'mixed-divider', kind: 'hr', y: [8, 8] },
    {
      id: 'overflow',
      label: 'overflowing label on a normally sized switch that should truncate by default',
      tooltip: 'normal switch with overflowing label',
    },
    { id: 'disabled', label: 'disabled row', enabled: false, opacity: { k: 0.3 } },
    {
      id: 'multiline',
      label: (
        <div>
          <div>{'multi-line label row'}</div>
          <div>{'second label line'}</div>
        </div>
      ),
    },
  ],
  grouped: [
    { id: 'foo' },
    {
      id: 'sample-group',
      kind: 'group',
      items: [
        { id: 'primary', label: 'primary row' },
        { id: 'nested-alpha', label: 'nested alpha', x: [18, 0] },
        { id: 'nested-bravo', label: 'nested bravo', x: [18, 0] },
        { id: 'sample-divider', kind: 'hr', y: [8, 8] },
        { id: 'secondary', label: 'secondary row' },
      ],
    },
    { id: 'bar' },
    { id: 'baz' },
  ],
};

/**
 * Spec/debug sample rows.
 */
export const SAMPLE = {
  defaultValues,

  source(sample?: SampleKind): t.KeyValueSwitches.Item[] {
    return [...descriptors[sample ?? 'basic']];
  },

  items(sample?: SampleKind, options: SampleOptions = {}): t.KeyValueSwitches.Item[] {
    return SAMPLE.withValues(SAMPLE.source(sample), options);
  },

  withValues(
    items: readonly t.KeyValueSwitches.Item[],
    options: SampleOptions = {},
  ): t.KeyValueSwitches.Item[] {
    const values: SampleValues = { ...defaultValues, ...options.values };
    const onToggle = options.onToggle;

    return items.map((item) => {
      if (isHr(item)) return item;
      if (isGroup(item)) return { ...item, items: SAMPLE.withValues(item.items, options) };

      const row: t.KeyValueSwitches.Row = { ...item, value: values[item.id] ?? false };
      if (onToggle) row.onToggle = onToggle;
      return row;
    });
  },

  reorder(
    current: readonly t.KeyValueSwitches.Item[],
    next: readonly t.KeyValue.Item[],
  ): t.KeyValueSwitches.Item[] {
    const byId = new Map(current.map((item) => [item.id, item]));
    return next.flatMap((item) => byId.get(item.id ?? '') ?? []);
  },
} as const;
