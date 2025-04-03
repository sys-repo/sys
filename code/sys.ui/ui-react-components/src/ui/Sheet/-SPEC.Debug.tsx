import React from 'react';
import { Button } from '../Button/mod.ts';
import { type t, css, DEFAULTS, Signal } from './common.ts';

type P = t.SheetProps;
const D = DEFAULTS;

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals(init?: (e: DebugSignals) => void) {
  const s = Signal.create;

  const props = {
    showing: s(true),
    theme: s<P['theme']>('Dark'),
    orientation: s<P['orientation']>(D.orientation.default),
    margin: s<P['margin']>(0),
  };
  const api = {
    props,
    listen() {
      const p = props;
      p.theme.value;
      p.showing.value;
      p.orientation.value;
      p.margin.value;
    },
  };
  init?.(api);
  return api;
}

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const d = debug.props;

  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
    title: css({ fontWeight: 'bold', marginBottom: 10 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>{'Mobile Sheet'}</div>
      <Button
        block
        label={`debug.showing: ${d.showing}`}
        onClick={() => Signal.toggle(d.showing)}
      />
      <hr />
      <Button
        block
        label={`theme: ${d.theme}`}
        onClick={() => Signal.cycle<P['theme']>(d.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={`orientation: ${d.orientation.value ?? '<undefined>'}`}
        onClick={() => {
          Signal.cycle<P['orientation']>(d.orientation, [...D.orientation.all, undefined]);
        }}
      />
      <Button
        block
        label={`margin: ${d.margin.value ?? '<undefined>'}`}
        onClick={() => {
          Signal.cycle<P['margin']>(d.margin, [undefined, 0, 10, [50, 15]]);
        }}
      />
    </div>
  );
};
