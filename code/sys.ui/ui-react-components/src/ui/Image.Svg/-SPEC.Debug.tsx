import React from 'react';
import { Button } from '../Button/mod.ts';
import { type t, Color, css, Signal } from './common.ts';

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
    width: Signal.create(200),
    color: Signal.create<'dark' | 'blue'>('dark'),
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

  Signal.useRedrawEffect(() => {
    p.theme.value;
    p.width.value;
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
        block={true}
        label={`theme: ${p.theme}`}
        onClick={() => Signal.cycle(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block={true}
        label={`width: ${p.width}`}
        onClick={() => {
          p.width.value = p.width.value === 200 ? 80 : 200;
        }}
      />
    </div>
  );
};
