import React from 'react';
import { type t, Button, Color, css, Signal } from './common.ts';

/**
 * Types:
 */
export type DebugProps = { ctx: { debug: DebugSignals }; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals(init?: (e: DebugSignals) => void) {
  type P = t.Landing3Props;
  const s = Signal.create;
  const props = {
    debug: s<P['debug']>(true),
    theme: s<P['theme']>('Dark'),
    backgroundVideoOpacity: s<P['backgroundVideoOpacity']>(0.15),
    stage: s<t.Stage>('Entry'),
  };
  const api = { props };
  init?.(api);
  return api;
}

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { ctx } = props;
  const p = ctx.debug.props;

  Signal.useRedrawEffect(() => {
    p.theme.value;
    p.debug.value;
    p.stage.value;
    p.backgroundVideoOpacity.value;
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
      <Button block label={`debug: ${p.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <hr />
      <Button
        block
        label={`stage: "${p.stage}"`}
        onClick={() => {
          Signal.cycle<t.Stage>(p.stage, ['Entry', 'Trailer', 'Overview', 'Programme']);
        }}
      />
      <Button
        block
        label={`theme: "${p.theme}"`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={`backgroundVideoOpacity: ${p.backgroundVideoOpacity}`}
        onClick={() => Signal.cycle(p.backgroundVideoOpacity, [undefined, 0.15, 0.3, 1])}
      />

      <hr />
    </div>
  );
};
