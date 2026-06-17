import React from 'react';
import { Color, css, Is, type t } from './common.ts';

export type SampleKind = 'basic' | 'mixed';
export type SampleValues = Record<string, boolean>;

type SampleRow = Omit<t.KeyValueSwitches.Row, 'value' | 'onToggle'>;
type SampleItem = SampleRow | t.KeyValue.Hr;
type ToggleHandler = (id: string, next: boolean) => void;
type SampleOptions = { values?: SampleValues; onToggle?: ToggleHandler };

const isHr = (item: SampleItem): item is t.KeyValue.Hr => {
  return Is.object(item) && 'kind' in item && item.kind === 'hr';
};

const Styles = {
  customLabel: css({ backgroundColor: Color.ruby(0.2) }),
};

const defaultValues = {
  capabilities: true,
  events: false,
  custom: true,
  large: true,
  overflow: false,
  disabled: true,
  multiline: false,
} satisfies SampleValues;

const descriptors: Record<SampleKind, readonly SampleItem[]> = {
  basic: [{ id: 'capabilities' }, { id: 'events' }],
  mixed: [
    { id: 'custom', label: <div className={Styles.customLabel.class}>{'custom label element'}</div> },
    {
      id: 'large',
      label: <div>{'here - look, a large switch'}</div>,
      switch: { height: 18, width: 34 },
    },
    { kind: 'hr', y: [8, 8] },
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
};

/** Spec/debug sample rows. */
export const SAMPLE = {
  defaultValues,

  items(sample?: SampleKind, options: SampleOptions = {}): t.KeyValueSwitches.Item[] {
    const kind = sample ?? 'basic';
    const values: SampleValues = { ...defaultValues, ...options.values };
    const onToggle = options.onToggle;

    return descriptors[kind].map((item) => {
      if (isHr(item)) return item;

      const row: t.KeyValueSwitches.Row = { ...item, value: values[item.id] ?? false };
      if (onToggle) row.onToggle = (next) => onToggle(item.id, next);
      return row;
    });
  },
} as const;
