import React from 'react';
import { Button } from '../Button/mod.ts';
import { type t, Color, css, Signal } from './common.ts';

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssValue };
export type DebugSignals = ReturnType<typeof createDebugSignals>;
type P = DebugProps;

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;
  const props = { theme: s<t.CommonTheme>('Light') };
  const api = {
    props,
    listen() {
      const p = props;
      p.theme.value;
    },
  };
  return api;
}

/**
 * Component:
 */
export const Debug: React.FC<P> = (props) => {
  const { debug } = props;
  const p = debug.props;

  Signal.useRedrawEffect(() => {
    p.theme.value;
  });

  /**
   * Render:
   */
  const theme = Color.theme(p.theme.value);
  const styles = {
    base: css({ color: theme.fg }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        label={`theme: ${p.theme}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
    </div>
  );
};
