import React from 'react';
import { Lorem } from '../../-test.ui.ts';
import { type t, Button, css, Signal } from './common.ts';

type P = t.FadeTextProps;

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
    text: s<P['text']>('Lorem'),
    loremIndex: s(0),
  };
  const api = {
    props,
    listen() {
      const p = props;
      p.theme.value;
      p.text.value;
      p.loremIndex.value;
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
        <div>{'FadeText'}</div>
      </div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />

      <hr />

      <Button
        block
        label={() => {
          const value = p.text.value;
          return `text: ${value ? `"${value}"` : '<undefined>'}`;
        }}
        onClick={() => {
          const index = (p.loremIndex.value += 1);
          p.text.value = Lorem.text.split(' ')[index];
        }}
      />

      <Button
        block
        label={() => `text: (clear)`}
        onClick={() => {
          p.text.value = undefined;
        }}
      />

      <Button
        block
        label={() => `text: (multi-line)`}
        onClick={() => {
          p.text.value = 'multi\nline';
        }}
      />
    </div>
  );
};
