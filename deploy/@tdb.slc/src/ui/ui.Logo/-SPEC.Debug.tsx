import React from 'react';
import { type t, Button, Color, css, Signal, DEFAULTS } from './common.ts';

const D = DEFAULTS;

/**
 * Types:
 */
export type DebugProps = { ctx: { debug: DebugSignals }; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;
type P = DebugProps;

/**
 * Signals:
 */
export function createDebugSignals(init?: (e: DebugSignals) => void) {
  const s = Signal.create;
  type P = t.LogoProps;
  const props = {
    width: s<number | undefined>(),
    theme: s<P['theme']>('Dark'),
    logo: s<P['logo']>(D.logo),
  };
  const api = { props };
  init?.(api);
  return api;
}

/**
 * Component:
 */
export const Debug: React.FC<P> = (props) => {
  const { ctx } = props;
  const p = ctx.debug.props;

  Signal.useRedrawEffect(() => {
    p.theme.value;
    p.width.value;
    p.logo.value;
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
        block
        label={`theme: ${p.theme}`}
        onClick={() => Signal.cycle<t.LogoProps['theme']>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={`width: ${p.width.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle(p.width, [undefined, 90, 150, 300])}
      />

      <Button
        block
        label={`logo: "${p.logo}"`}
        onClick={() => Signal.cycle<t.LogoKind>(p.logo, ['SLC', 'CreativeCommons'])}
      />

      <hr />
    </div>
  );
};
