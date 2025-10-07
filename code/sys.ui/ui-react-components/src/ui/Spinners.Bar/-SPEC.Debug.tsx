import React from 'react';
import { type t, Button, css, Signal } from '../u.ts';
import { D } from './common.ts';

type P = t.BarSpinnerProps;

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
    theme: s<P['theme']>('Light'),
    width: s<P['width']>(),
    transparentTrack: s<P['transparentTrack']>(false),
  };
  const api = {
    props,
    listen() {
      const p = props;
      p.theme.value;
      p.width.value;
      p.transparentTrack.value;
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
  const p = debug.props;

  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
    title: css({
      fontWeight: 'bold',
      marginBottom: 10,
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>
        <div>{'Spinners.Bar'}</div>
        <div />
        <div></div>
      </div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />

      <Button
        block
        label={() => `width: ${p.width.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['width']>(p.width, [undefined, 30, D.width, 300])}
      />

      <Button
        block
        label={() => `transparentTrack: ${p.transparentTrack.value}`}
        onClick={() => Signal.toggle(p.transparentTrack)}
      />

      <hr />
    </div>
  );
};
