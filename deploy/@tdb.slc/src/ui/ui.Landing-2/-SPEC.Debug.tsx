import React from 'react';
import { type t, Button, Color, css, Signal } from './common.ts';

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals(init?: (e: DebugSignals) => void) {
  type P = t.Landing2Props;
  const s = Signal.create;
  const props = {
    debug: s<P['debug']>(false),
    theme: s<P['theme']>('Dark'),
    backgroundVideo: s<P['backgroundVideo']>(0.15),
  };
  const api = { props };
  init?.(api);
  return api;
}

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;

  Signal.useRedrawEffect(() => {
    p.theme.value;
    p.debug.value;
    p.backgroundVideo.value;
  });

  /**
   * Render:
   */
  const theme = Color.theme(p.theme.value);
  const styles = {
    base: css({}),
    title: css({ fontWeight: 'bold', marginBottom: 10 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>{'Landing-2'}</div>
      <hr />

      <Button block label={`debug: ${p.debug}`} onClick={() => Signal.toggle(p.debug)} />

      <Button
        block
        label={`theme: "${p.theme}"`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />

      <Button
        block
        label={`backgroundVideo: ${p.backgroundVideo}`}
        onClick={() => Signal.cycle(p.backgroundVideo, [undefined, 0, 0.15, 0.3, 0.5])}
      />

      <hr />
    </div>
  );
};
