import React from 'react';
import { type t, App, Button, css, Signal } from './common.ts';

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
  const d = debug.props;
  const p = d.signals.props;

  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
    title: css({ fontWeight: 'bold', marginBottom: 10 }),
  };

  const title = `Layout: ${d.breakpoint.value} → ${p.stage.value}`;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>{title}</div>

      <Button
        block
        label={`theme: ${p.theme}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <hr />
      <Button
        block
        label={`size breakpoint: "${d.breakpoint}"`}
        onClick={() => {
          Signal.cycle<t.BreakpointName>(d.breakpoint, ['Desktop', 'Intermediate', 'Mobile']);
        }}
      />
      <Button
        block
        label={`stage: "${p.stage}"`}
        onClick={() => {
          Signal.cycle<t.Stage>(p.stage, ['Entry', 'Trailer', 'Overview', 'Programme']);
        }}
      />
      <hr />
    </div>
  );
};
