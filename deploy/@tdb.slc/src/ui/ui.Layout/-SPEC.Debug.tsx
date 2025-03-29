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

  const props = { theme: s<t.CommonTheme>('Dark') };
  const api = {
    app,
    props,
    listen() {
      app.listen();
      props.theme.value;
    },
  };

  app.props.breakpoint.value = 'Mobile';
  app.stack.push(await AppContent.find('Trailer'));

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
      <div className={styles.title.class}>{`${p.breakpoint.value} Layout`}</div>

      <Button
        block
        label={`theme: ${d.theme}`}
        onClick={() => Signal.cycle<t.CommonTheme>(d.theme, ['Light', 'Dark'])}
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
