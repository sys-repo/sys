import React from 'react';
import { type t, App, AppContent, Button, css, Signal, slug } from './common.ts';
import { Sample } from './-SPEC.Samples.tsx';

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = Awaited<ReturnType<typeof createDebugSignals>>;

/**
 * Signals:
 */
export async function createDebugSignals(init?: (e: DebugSignals) => void) {
  const s = Signal.create;
  const app = App.signals();

  const props = { theme: s<t.CommonTheme>('Dark') };
  const api = {
    app,
    props,
    listen() {
      app.listen();
      props.theme.value;
    },
  };

  app.props.screen.breakpoint.value = 'Mobile';
  app.stack.push(Sample.content0());

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

  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
    title: css({ fontWeight: 'bold', marginBottom: 10 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>{`${p.screen.breakpoint.value} Layout`}</div>

      <Button
        block
        label={`theme: ${d.theme}`}
        onClick={() => Signal.cycle<t.CommonTheme>(d.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Button
        block
        label={`screen.breakpoint: "${p.screen.breakpoint}"`}
        onClick={() => {
          Signal.cycle<t.BreakpointName>(p.screen.breakpoint, [
            'Desktop',
            'Intermediate',
            'Mobile',
          ]);
        }}
      />

      <hr />

      <div className={styles.title.class}>{`Stack: ${app.stack.length}`}</div>

      <Button
        block
        label={`stack.push`}
        onClick={() => {
          app.stack.push(Sample.content1());
        }}
      />
      <Button block label={`stack.pop`} onClick={() => app.stack.pop()} />
      <Button block label={`stack.clear`} onClick={() => app.stack.clear()} />

      <hr />

      <Button
        block
        label={`API.video.playing: ${app.video.props.playing}`}
        onClick={() => Signal.toggle(app.video.props.playing)}
      />

      <hr />
    </div>
  );
};
