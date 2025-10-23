import React from 'react';
import { Button } from '../../u.ts';
import { type t, Color, css, D, Signal } from '../common.ts';

import type { DebugSignals } from './-SPEC.Debug.tsx';

type L = t.KeyValueLayout;
type LT = t.KeyValueLayoutTable;
type SelectedLayout = DebugSignals['props']['layoutSpaced' | 'layoutTable'];

export type LayoutButtonsProps = {
  debug: DebugSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
type P = LayoutButtonsProps;

/**
 * Component:
 */
export const LayoutButtons: React.FC<P> = (props) => {
  const { debug } = props;
  const p = debug.props;

  const layout = p.layout.value;
  let selected: SelectedLayout | undefined;
  if (layout === 'spaced') selected = p.layoutSpaced;
  if (layout === 'table') selected = p.layoutTable;

  let defaults: L | undefined;
  if (layout === 'spaced') defaults = D.layout.spaced;
  if (layout === 'table') defaults = D.layout.table;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg }),
    body: css({ marginLeft: 44 }),
  };

  const elTable = layout === 'table' && (
    <>
      <Button
        block
        label={() => `.keyMax: ${p.layoutTable.keyMax.value}`}
        onClick={() => {
          Signal.cycle<LT['keyMax']>(p.layoutTable.keyMax, [D.layout.table.keyMax, 60, '5ch']);
        }}
      />
      <Button
        block
        label={() => `.keyAlign: ${p.layoutTable.keyAlign.value}`}
        onClick={() => {
          Signal.cycle<LT['keyAlign']>(p.layoutTable.keyAlign, ['left', 'right']);
        }}
      />
    </>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        block
        label={() => {
          const v = p.layout.value;
          return `layout.kind: ${v ? `"${v}"` : '(undefined)'}`;
        }}
        onClick={() => Signal.cycle(p.layout, ['spaced', 'table'])}
      />
      <div className={styles.body.class}>
        <CommonLayout {...props} layout={selected} defaults={defaults} />
        {elTable}
      </div>
    </div>
  );
};

/**
 * Common Layout Props
 */
function CommonLayout(props: P & { layout?: SelectedLayout; defaults?: L }) {
  const { debug, layout, defaults } = props;
  if (!layout || !defaults) return null;

  return (
    <>
      <Button
        block
        label={() => `.columnGap: ${layout.columnGap.value}`}
        onClick={() => {
          Signal.cycle<L['columnGap']>(layout.columnGap, [0, 4, 8, 16, 22, 36]);
        }}
      />
      <Button
        block
        label={() => `.rowGap: ${layout.rowGap.value}`}
        onClick={() => {
          Signal.cycle<L['rowGap']>(layout.rowGap, [0, defaults.rowGap, 6, 10]);
        }}
      />
      <Button
        block
        label={() => `.align: ${layout.align.value}`}
        onClick={() => {
          Signal.cycle<L['align']>(layout.align, [defaults.align, 'start', 'center', 'end']);
        }}
      />
    </>
  );
}
