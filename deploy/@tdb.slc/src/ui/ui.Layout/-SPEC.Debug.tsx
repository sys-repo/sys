import React from 'react';
import { type t, App, Button, css, Signal } from './common.ts';

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
  const props = {
    breakpoint: s<t.BreakpointName>('Mobile'),
  };

  const api = {
    app,
    props,
    listen() {
      app.listen();
      props.breakpoint.value;
    },
  };

  app.load(await App.Content.find('Entry'));
  init?.(api);
  return api;
}

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const app = debug.app;
  const d = debug.props;
  const p = app.props;

  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
    title: css({ fontWeight: 'bold', marginBottom: 10 }),
  };

  const title = `Layout: ${d.breakpoint.value} → ${p.content.value?.id ?? '<unknown>'}`;

  const load = (stage: t.Stage) => {
    return (
      <Button
        block
        label={`load: "${stage}"`}
        onClick={async () => {
          const content = await App.Content.find(stage);
          await app.load(content);
        }}
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

      {load('Entry')}
      {load('Trailer')}
      {load('Overview')}
      {load('Programme')}
      <Button block label={`(unload)`} onClick={() => app.load(undefined)} />

      <hr />
    </div>
  );
};
