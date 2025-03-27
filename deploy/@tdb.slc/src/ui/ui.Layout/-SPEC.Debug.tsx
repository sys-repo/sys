import React from 'react';
import { type t, App, Button, Color, css, Signal } from './common.ts';

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
    signals: App.signals(), // NB: global "Screens" API.
    breakpoint: s<t.BreakpointName>('Mobile'),
  };

  const api = {
    props,
    listen() {
      const p = props;
      p.signals.listen();
      p.breakpoint.value;
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
  const theme = Color.theme(p.signals.theme.value);
  const styles = {
    base: css({}),
    title: css({ fontWeight: 'bold', marginBottom: 10 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>{'Layout:'}</div>

      <Button
        block
        label={`theme: ${p.signals.theme}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.signals.theme, ['Light', 'Dark'])}
      />
      <hr />
      <Button
        block
        label={`breakpoint: "${p.breakpoint}"`}
        onClick={() => {
          Signal.cycle<t.BreakpointName>(p.breakpoint, ['Desktop', 'Intermediate', 'Mobile']);
        }}
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
