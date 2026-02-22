import React from 'react';
import { type t, BulletList, Color, css, Json, ObjectView, Signal } from './common.ts';

type P = t.TreeHost.Props;

export type PropSlotsProps = {
  debug: t.DebugSignals;
  theme?: t.CommonTheme;
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
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>spinner:</div>
      <BulletList.UI
        theme={theme.name}
        style={{ fontSize: 12, marginLeft: 15 }}
        columns={2}
        selected={spinnerSelection(v.spinner)}
        items={OPTIONS.map((item) => ({ id: item.id, label: item.label }))}
        onSelect={(e) => {
          const next = OPTIONS.find((item) => item.id === e.id);
          if (next) p.spinner.value = next.value;
        }}
      />
      {v.spinner && <ObjectView name={'prop.spinner'} data={v.spinner} fontSize={11} />}
    </div>
  );
};

const OPTIONS: ReadonlyArray<{ id: string; label: string; value: P['spinner'] }> = [
  { id: 'none', label: '(none)', value: undefined },
  {
    id: 'all-top',
    label: 'all: top',
    value: [
      { slot: 'nav:header', position: 'top' },
      { slot: 'nav:tree', position: 'top' },
      { slot: 'main:body', position: 'top' },
      { slot: 'nav:footer', position: 'top' },
    ],
  },
  {
    id: 'header-top',
    label: 'nav.header: top',
    value: { slot: 'nav:header', position: 'top' },
  },
  { id: 'tree-middle', label: 'nav.tree: middle', value: { slot: 'nav:tree', position: 'middle' } },
  { id: 'tree-top', label: 'nav.tree: top', value: { slot: 'nav:tree', position: 'top' } },
  {
    id: 'tree-top-blur',
    label: 'nav.tree: top (blur 6)',
    value: { slot: 'nav:tree', position: 'top', backgroundBlur: 3, backgroundOpacity: 0.3 },
  },
  { id: 'tree-bottom', label: 'nav.tree: bottom', value: { slot: 'nav:tree', position: 'bottom' } },
  {
    id: 'main-middle',
    label: 'main.body: middle',
    value: { slot: 'main:body', position: 'middle' },
  },
  { id: 'main-top', label: 'main.body: top', value: { slot: 'main:body', position: 'top' } },
  {
    id: 'main-bottom',
    label: 'main.body: bottom',
    value: { slot: 'main:body', position: 'bottom' },
  },
  {
    id: 'footer-middle',
    label: 'nav.footer: middle',
    value: { slot: 'nav:footer', position: 'middle' },
  },
  {
    id: 'main-top-blur',
    label: 'main.body: top (blur 6)',
    value: { slot: 'main:body', position: 'top', backgroundBlur: 6 },
  },
  {
    id: 'leaf-top-main-bottom',
    label: 'nav.leaf: top + main.body: bottom',
    value: [
      { slot: 'nav:leaf', position: 'top' },
      { slot: 'main:body', position: 'bottom' },
    ],
  },
];
