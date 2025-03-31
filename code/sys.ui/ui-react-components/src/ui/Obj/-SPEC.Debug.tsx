import React from 'react';
import { Button } from '../Button/mod.ts';
import { type t, css, Signal } from './common.ts';

type P = t.ObjProp;

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
    fontSize: s<P['fontSize']>(),
    name: s<P['name']>('my-name'),
    data: s<P['data']>({ msg: '👋', count: 0 }),
  };
  const api = {
    props,
    listen() {
      const p = props;
      p.theme.value;
      p.fontSize.value;
      p.data.value;
      p.name.value;
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
    title: css({ fontWeight: 'bold', marginBottom: 10 }),
    cols: css({ display: 'grid', gridTemplateColumns: 'auto 1fr auto' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={css(styles.title, styles.cols).class}>
        <div>{'Obj '}</div>
        <div />
        <div>{'(Object View)'}</div>
      </div>

      <Button
        block
        label={`theme: "${p.theme}"`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <Button
        block
        label={`fontSize: ${p.fontSize ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['fontSize']>(p.fontSize, [undefined, 14, 18, 32])}
      />

      <hr />
    </div>
  );
};
