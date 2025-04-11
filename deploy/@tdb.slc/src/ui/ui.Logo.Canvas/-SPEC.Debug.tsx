import React from 'react';
import { type t, Color, css, DEFAULTS, Signal } from './common.ts';

import { Button } from '@sys/ui-react-components';

/**
 * Types
 */
export type DebugProps = { ctx: { debug: DebugSignals }; style?: t.CssValue };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals
 */
export function createDebugSignals() {
  type P = t.LogoCanvasProps;
  const s = Signal.create;
  const props = {
    theme: s<P['theme']>('Dark'),
    width: s<P['width']>(400),
    selected: s<P['selected']>('purpose'),
    over: s<P['over']>(),
  };
  const api = {
    props,
    listen() {
      const p = props;
      p.width.value;
      p.selected.value;
      p.over.value;
      p.theme.value;
    },
  };
  return api;
}

/**
 * Component
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { ctx } = props;
  const p = ctx.debug.props;

  Signal.useRedrawEffect(() => {
    p.theme.value;
    p.width.value;
    p.over.value;
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
        onClick={() => Signal.cycle(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block={true}
        label={`width: ${p.width.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle(p.width, [undefined, 280, 400])}
      />

      <hr />
    </div>
  );
};
