import React from 'react';
import { type t, Str, Button, Color, css, Signal } from './common.ts';
import { Images } from '../../ui.Overview/mod.ts';
import { forEach } from 'rambda';

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
    src: s<P['src']>(),
  };
  const api = {
    props,
    listen() {
      const p = props;
      p.theme.value;
      p.src.value;
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
        onClick={async () => {
          const images = await Promise.all(Object.values(Images).map((loader) => loader()));
          Signal.cycle<P['src']>(p.src, images);
        }}
      />

      <hr />
    </div>
  );
};
