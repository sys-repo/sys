import React from 'react';
import { type t, Color, css, DEFAULTS, Signal } from './common.ts';

import { Button } from '@sys/ui-react-components';

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
    theme: Signal.create<t.CommonTheme>('Dark'),
    width: Signal.create<number>(DEFAULTS.width),
    selected: Signal.create<t.CanvasPanel | undefined>('purpose'),
    over: Signal.create<t.CanvasPanel | undefined>(),
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
    p.over.value;
  });

  /**
   * Render:.
   */
  const theme = Color.theme(p.theme.value);
  const styles = {
    base: css({ color: theme.fg }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        label={`theme: ${p.theme}`}
        onClick={() => Signal.cycle(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block={true}
        label={`width: ${p.width}`}
        onClick={() => (p.width.value = p.width.value === 200 ? 400 : 200)}
      />
    </div>
  );
};
