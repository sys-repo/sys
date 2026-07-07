import React from 'react';
import { Color, css, Is, type t } from './common.ts';

export type SampleKind = 'basic' | 'mixed' | 'grouped';
export type SampleValues = Record<string, boolean>;

type SampleRow = Omit<t.KeyValueSwitches.Row, 'value' | 'onToggle'>;
type SampleGroup = Omit<t.KeyValueSwitches.Group, 'items'> & { items: SampleItem[] };
type SampleItem = SampleRow | t.KeyValue.Hr | SampleGroup;
type ToggleHandler = (id: string, next: boolean) => void;
type SampleOptions = { values?: SampleValues; onToggle?: ToggleHandler };

const isHr = (item: t.KeyValueSwitches.Item): item is t.KeyValue.Hr => {
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
  capabilities: true,
  events: false,
  custom: true,
  large: true,
  overflow: false,
  disabled: true,
  multiline: false,
  overview: true,
  database: true,
  snapshots: false,
  audit: true,
  cache: false,
  afterGroup: true,
} satisfies SampleValues;

const descriptors: Record<SampleKind, readonly SampleItem[]> = {
  basic: [{ id: 'capabilities' }, { id: 'events' }],
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
    { id: 'overview', label: 'overview row' },
    {
      id: 'runtime-group',
      kind: 'group',
      items: [
        { id: 'database', label: 'database enabled' },
        { id: 'snapshots', label: 'periodic snapshots' },
        { id: 'runtime-divider', kind: 'hr', y: [8, 8] },
        {
          id: 'nested-flags',
          kind: 'group',
          items: [
            { id: 'audit', label: 'audit trail' },
            { id: 'cache', label: 'cache layer' },
          ],
        },
      ],
    },
    { id: 'afterGroup', label: 'row after group' },
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
      if (onToggle) row.onToggle = (next) => onToggle(item.id, next);
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
