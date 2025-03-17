import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, Time, DEFAULTS, rx } from './common.ts';
import { Button } from '../Button/mod.ts';

/**
 * Types
 */
export type DebugProps = { ctx: { debug: DebugSignals }; style?: t.CssValue };
export type DebugSignals = ReturnType<typeof createDebugSignals>;
type P = DebugProps;

/**
 * Signals
 */
export function createDebugSignals() {
  const props = {
    theme: Signal.create<t.CommonTheme>('Light'),
  };
  const api = { props };
  return api;
}

/**
 * Component
 */
export const Debug: React.FC<P> = (props) => {
  const { ctx } = props;
  const p = ctx.debug.props;

  const [, setRender] = useState(0);
  const redraw = () => setRender((n) => n + 1);
  Signal.useSignalEffect(() => {
    p.theme.value;
    Time.delay(redraw);
  });

  /**
   * Render
   */
  const theme = Color.theme(p.theme.value);
  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      color: theme.fg,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        label={`theme: ${p.theme}`}
        onClick={() => Signal.cycle(p.theme, ['Light', 'Dark'])}
      />
    </div>
  );
};
