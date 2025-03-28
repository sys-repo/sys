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
  const app = App.signals();
  const props = { theme: s<t.CommonTheme>('Dark') };
  const api = { props, app };
  init?.(api);
  return api;
}

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const app = debug.app;
  const p = app.props;
  const d = debug.props;

  Signal.useRedrawEffect(() => debug.app.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        block
        label={`theme: ${d.theme}`}
        onClick={() => Signal.cycle<t.CommonTheme>(d.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={`background.video.opacity: ${p.background.video.opacity.value ?? '<undefined>'}`}
        onClick={() => {
          Signal.cycle<number | undefined>(p.background.video.opacity, [undefined, 0.3, 0.6, 1]);
        }}
      />
      <hr />
    </div>
  );
};
