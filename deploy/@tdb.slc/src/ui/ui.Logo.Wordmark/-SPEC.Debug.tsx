import React from 'react';
import { type t, Button, css, DEFAULTS, Signal } from './common.ts';

const D = DEFAULTS;

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
  type P = t.LogoWordmarkProps;
  const props = {
    width: s<number | undefined>(300),
    theme: s<P['theme']>('Dark'),
    logo: s<P['logo']>(D.logo),
  };
  const api = {
    props,
    listen() {
      const p = props;
      p.width.value;
      p.theme.value;
      p.logo.value;
    },
  };
  init?.(api);
  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
};

/**
 * Component:
 */
export const Debug: React.FC<P> = (props) => {
  const { debug } = props;
  const p = debug.props;

  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>
      <Button
        block
        label={`width: ${p.width.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle(p.width, [undefined, 90, 150, 300])}
      />

      <hr />
      <Button
        block
        label={`theme: ${p.theme}`}
        onClick={() => Signal.cycle<t.LogoWordmarkProps['theme']>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={`logo: "${p.logo}"`}
        onClick={() => Signal.cycle<t.LogoKind>(p.logo, ['SLC', 'CC'])}
      />

      <hr />
    </div>
  );
};
