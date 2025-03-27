import React from 'react';
import { type t, Button, Color, createSignals, css, Signal } from './common.ts';

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals(init?: (e: DebugSignals) => void) {
  type P = t.MobileLayoutProps;
  const s = Signal.create;

  const props = {
    signals: createSignals(), // NB: global "Screens" API.
    theme: s<P['theme']>('Dark'),
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
    debug.props.signals.listen();
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
      <div className={styles.title.class}>{'Layout: Mobile'}</div>

      <Button
        block
        label={`theme: ${p.theme}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={`stage: "${p.signals.stage}"`}
        onClick={() => {
          Signal.cycle<t.Stage>(p.signals.stage, ['Entry', 'Trailer', 'Overview', 'Programme']);
        }}
      />
      <hr />
    </div>
  );
};
