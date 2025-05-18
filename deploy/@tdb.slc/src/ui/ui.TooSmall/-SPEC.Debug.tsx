import React from 'react';
import { type t, Button, css, Signal, Str } from './common.ts';

type P = t.TooSmallProps;

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
    children: s<P['children']>(),
  };
  const api = {
    props,
    listen() {
      const p = props;
      p.theme.value;
      p.children.value;
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
        <div>{'TooSmall'}</div>
      </div>
      <Button
        block
        label={() => `theme: ${p.theme}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => {
          const value = p.children.value;
          const fmt = value ? Str.truncate(String(value), 40) : '<undefined>';
          return `children: ${fmt}`;
        }}
        onClick={() => {
          const multiline = `
            Please make your window bigger, or
            move over to your mobile device.
            `;

          Signal.cycle<P['children']>(p.children, [
            undefined,
            '👋 Hello',
            multiline,
            Str.Lorem.text,
          ]);
        }}
      />
      <hr />
    </div>
  );
};
