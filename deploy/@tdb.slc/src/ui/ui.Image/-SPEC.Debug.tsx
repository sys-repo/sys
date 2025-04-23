import React from 'react';
import { IMAGE } from '../../ui.content/ui.Overview/common.ts';
import { type t, Button, css, Signal } from './common.ts';

type P = t.ImageViewProps;

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
    padding: s<P['padding']>(),
    src: s<string>(),
  };
  const api = {
    props,
    listen() {
      const p = props;
      p.theme.value;
      p.src.value;
      p.padding.value;
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
    title: css({
      fontWeight: 'bold',
      marginBottom: 10,
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>
        <div>{'Image'}</div>
      </div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />

      <Button
        block
        label={() => {
          const value = p.src.value;
          return `src: ${value ? `...${value.slice(-36)}` : '<undefined>'}`;
        }}
        onClick={() => {
          Signal.cycle<P['src']>(p.src, Object.values(IMAGE));
        }}
      />

      <Button
        block
        label={() => `padding: ${p.padding.value ?? '<undefined>'}`}
        onClick={() => {
          Signal.cycle<P['padding']>(p.padding, [undefined, 30, '20%', [10, 20, 50, 80]]);
        }}
      />

      <hr />
    </div>
  );
};
