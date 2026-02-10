import React from 'react';
import { type t, BulletList, Color, css, Json, ObjectView, Signal } from './common.ts';

type P = t.TreeHostProps;

export type PropSlotsProps = {
  debug: t.DebugSignals;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const PropSpinner: React.FC<PropSlotsProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const v = Signal.toObject(p);
  Signal.useRedrawEffect(debug.listen);

  function spinnerSelection(value: P['spinner']) {
    const current = Json.stringify(value ?? null);
    const hit = OPTIONS.find((item) => Json.stringify(item.value ?? null) === current);
    return hit?.id;
  }

  /**
   * Render:
   */
  const theme = Color.theme(v.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
    body: css({ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>spinner:</div>
      <div className={styles.body.class}>
        <BulletList.UI
          theme={theme.name}
          style={{ fontSize: 12, marginLeft: 15 }}
          selected={spinnerSelection(v.spinner)}
          items={OPTIONS.map((item) => ({ id: item.id, label: item.label }))}
          onSelect={(e) => {
            const next = OPTIONS.find((item) => item.id === e.id);
            if (next) p.spinner.value = next.value;
          }}
        />
        {v.spinner && <ObjectView name={'prop.spinner'} data={v.spinner} fontSize={11} />}
      </div>
    </div>
  );
};

const OPTIONS: ReadonlyArray<{ id: string; label: string; value: P['spinner'] }> = [
  { id: 'none', label: '(none)', value: undefined },
  {
    id: 'all-top',
    label: 'all: top',
    value: [
      { slot: 'tree', position: 'top' },
      { slot: 'main', position: 'top' },
      { slot: 'aux', position: 'top' },
    ],
  },
  { id: 'tree-middle', label: 'tree: middle', value: { slot: 'tree', position: 'middle' } },
  { id: 'tree-top', label: 'tree: top', value: { slot: 'tree', position: 'top' } },
  {
    id: 'tree-top-blur',
    label: 'tree: top (blur 6)',
    value: { slot: 'tree', position: 'top', backgroundBlur: 6 },
  },
  { id: 'tree-bottom', label: 'tree: bottom', value: { slot: 'tree', position: 'bottom' } },
  { id: 'main-middle', label: 'main: middle', value: { slot: 'main', position: 'middle' } },
  { id: 'main-top', label: 'main: top', value: { slot: 'main', position: 'top' } },
  { id: 'main-bottom', label: 'main: bottom', value: { slot: 'main', position: 'bottom' } },
  { id: 'aux-middle', label: 'aux: middle', value: { slot: 'aux', position: 'middle' } },
  {
    id: 'main-top-blur',
    label: 'main: top (blur 6)',
    value: { slot: 'main', position: 'top', backgroundBlur: 6 },
  },
  {
    id: 'leaf-top-main-bottom',
    label: 'treeLeaf: top + main: bottom',
    value: [
      { slot: 'treeLeaf', position: 'top' },
      { slot: 'main', position: 'bottom' },
    ],
  },
];
