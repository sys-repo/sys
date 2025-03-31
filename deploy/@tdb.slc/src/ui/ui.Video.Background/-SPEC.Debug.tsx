import React from 'react';
import { App } from '../App/mod.ts';
import { type t, Button, css, Signal } from './common.ts';

type P = t.VideoBackgroundProps;

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
  const props = {
    theme: s<t.CommonTheme>('Dark'),
  };
  const api = {
    props,
    app,
    listen() {
      const p = props;
      app.listen();
    },
  };

  app.props.background.video.opacity.value = 0.6;
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
  const bg = p.background;

  Signal.useRedrawEffect(() => debug.listen());

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
        label={`background.video.opacity: ${bg.video.opacity.value ?? '<undefined> (100%)'}`}
        onClick={() => {
          Signal.cycle<number | undefined>(bg.video.opacity, [0, 0.3, 0.6, undefined]);
        }}
      />
      <Button
        block
        label={`background.video.playing: ${bg.video.playing.value}`}
        onClick={() => {
          Signal.toggle(bg.video.playing);
        }}
      />
      <hr />
    </div>
  );
};
