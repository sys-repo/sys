import React from 'react';
import { Sample } from './-SPEC.Samples.tsx';
import {
  layerVideoPlayerButtons,
  pushStackContentButtons,
  screenBreakpointButton,
} from './-SPEC.u.tsx';
import { type t, Str, App, Button, css, Signal } from './common.ts';

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
  app.stack.push(Sample.sample0());

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
    dblcol: css({ display: 'grid', gridTemplateColumns: 'auto 1fr auto' }),
  };

  const pushSample = (name: string, fn: () => t.Content) => {
    return <Button block label={`stack.push:( "${name}" )`} onClick={() => app.stack.push(fn())} />;
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
      {screenBreakpointButton(app)}

      <hr />
      <div className={css(styles.title, styles.dblcol).class}>
        <div>{`Stack:`}</div>
        <div />
        <div>{`${app.stack.length} ${Str.plural(app.stack.length, 'Layer', 'Layers')}`}</div>
      </div>

      {pushSample('sample-layer-0', Sample.sample0)}
      {pushSample('sample-layer-1', Sample.sample1)}

      <hr />
      {pushStackContentButtons(app)}

      <hr />

      {layerVideoPlayerButtons(app)}
    </div>
  );
};
