import React from 'react';
import { type t, Str, css, Signal } from './common.ts';
import { Button } from '../Button/mod.ts';

type P = t.FadeElementProps;

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
        <div>{'FadeElement'}</div>
      </div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />

      <hr />

      <Button
        block
        label={() => `text: <undefined>`}
        onClick={() => {
          p.text.value = undefined;
        }}
      />

      <Button
        block
        label={() => {
          const value = p.text.value;
          const isWord = !(value?.includes('\n') ?? false);
          const word = isWord ? ' (word)' : '';
          return `text: ${value ? `"${value}" ${word}` : '<undefined>'}`;
        }}
        onClick={() => {
          const index = (p.loremIndex.value += 1);
          p.text.value = Str.Lorem.text.split(' ')[index];
        }}
      />

      <Button
        block
        label={() => `text: multi-line`}
        onClick={() => {
          p.text.value = 'multi\nline';
        }}
      />
    </div>
  );
};
