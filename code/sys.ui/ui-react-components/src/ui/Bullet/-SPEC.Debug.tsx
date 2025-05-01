import React from 'react';
import { Button } from '../Button/mod.ts';
import { type t, css, D, Signal } from './common.ts';

type P = t.BulletProps;

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;
  const props = {
    debug: s(false),
    theme: s<P['theme']>('Light'),
    size: s<P['size']>(),
    selected: s<P['selected']>(),
    filled: s<P['filled']>(),
  };
  const p = props;
  const api = {
    props,
    listen() {
      p.debug.value;
      p.theme.value;
      p.size.value;
      p.selected.value;
      p.filled.value;
    },
  };
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
export const Debug: React.FC<DebugProps> = (props) => {
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
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />

      <hr />
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `size: ${p.size.value ?? `<undefined> (default: ${D.size})`}`}
        onClick={() => Signal.cycle(p.size, [16, 22, 64, undefined])}
      />
      <Button
        block
        label={() => `selected: ${p.selected.value ?? `<undefined> (default: ${D.selected})`}`}
        onClick={() => Signal.toggle(p.selected)}
      />
      <Button
        block
        label={() => `filled: ${p.filled.value ?? `<undefined> (default: ${D.filled})`}`}
        onClick={() => Signal.toggle(p.filled)}
      />
      <hr />
    </div>
  );
};
