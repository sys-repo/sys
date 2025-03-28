import React from 'react';
import { type t, App, AppContent, Button, css, Signal, slug } from './common.ts';

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

  const api = {
    app,
    listen() {
      app.listen();
    },
  };

  app.props.breakpoint.value = 'Mobile';
  app.load(await AppContent.find('Trailer'));

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

  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
    title: css({ fontWeight: 'bold', marginBottom: 10 }),
  };

  const title = `Layout: ${p.breakpoint.value} → ${p.content.value?.id ?? '<unloaded>'}`;
  const load = (stage: t.Stage) => {
    return (
      <Button
        block
        label={`load: "${stage}"`}
        onClick={async () => app.load(await AppContent.find(stage))}
      />
    );
  };

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
        label={`size breakpoint: "${p.breakpoint}"`}
        onClick={() => {
          Signal.cycle<t.BreakpointName>(p.breakpoint, ['Desktop', 'Intermediate', 'Mobile']);
        }}
      />

      <hr />

      {load('Entry')}
      {load('Trailer')}
      {load('Overview')}
      {load('Programme')}
      <Button block label={`(unload)`} onClick={() => app.load(undefined)} />

      <hr />

      <div className={styles.title.class}>{`Stack: ${app.stack.length}`}</div>

      <Button
        block
        label={`stack.push`}
        onClick={() => {
          const id = `screen-${slug()}`;
          app.stack.push({
            id,
            timestamps: {
              '00:00:00.000': {
                render(props) {
                  return <div>{id}</div>;
                },
              },
            },
          });
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
