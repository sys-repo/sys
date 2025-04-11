import React from 'react';
import { type t, Button, Color, css, Signal } from '../-test.ui.ts';

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;
type P = DebugProps;

/**
 * Signals:
 */
export function createDebugSignals(init?: (e: DebugSignals) => void) {
  const s = Signal.create;
  const props = { theme: s<t.CommonTheme>('Light') };
  const api = { props };
  init?.(api);
  return api;
}

/**
 * Component:
 */
export const Debug: React.FC<P> = (props) => {
  const { debug } = props;
  const p = debug.props;

  Signal.useRedrawEffect(() => p.theme.value);

  /**
   * Render:
   */
  const theme = Color.theme(p.theme.value);
  const styles = {
    base: css({
      // color: theme.fg,
    }),
    title: css({ fontWeight: 'bold' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>CSS: @container</div>
      <hr />

      <Button
        block
        label={`theme: ${p.theme}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
    </div>
  );
};
