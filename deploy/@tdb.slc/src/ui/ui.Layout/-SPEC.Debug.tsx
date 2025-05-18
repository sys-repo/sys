import React from 'react';
import { Sample } from './-SPEC.u.sample.tsx';
import {
  Content,
  layerVideoPlayerButtons,
  pushStackContentButtons,
  screenBreakpointButton,
} from './-SPEC.u.tsx';
import { type t, App, Button, css, ObjectView, Signal, Str } from './common.ts';

export { layerVideoPlayerButtons };

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
    theme: s<t.CommonTheme>('Dark'),
  };
  const api = {
    app,
    props,
    listen() {
      app.listen();
      props.theme.value;
    },
  };

  // app.props.screen.breakpoint.value = 'Mobile';
  app.props.screen.breakpoint.value = 'Desktop';

  // app.stack.push(Sample.sample0());
  app.stack.push(await Content.factory('Entry'));
  // app.stack.push(await Content.factory('Trailer'));
  // app.stack.push(await Content.factory('Overview'));
  // app.stack.push(await Content.factory('Programme'));

  init?.(api);
  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
};

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
  };

  const pushSample = (name: string, fn: () => t.Content) => {
    return <Button block label={`stack.push:( "${name}" )`} onClick={() => app.stack.push(fn())} />;
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>
        <div>{`Layout`}</div>
        <div>{p.screen.breakpoint.value}</div>
      </div>

      <Button
        block
        label={() => `debug: ${app.props.debug.value}`}
        onClick={() => Signal.toggle(app.props.debug)}
      />
      <Button
        block
        label={`theme: ${d.theme}`}
        onClick={() => Signal.cycle<t.CommonTheme>(d.theme, ['Light', 'Dark'])}
      />

      <hr />
      {screenBreakpointButton(app)}

      <hr />
      <div className={Styles.title.class}>
        <div>{`Stack:`}</div>
        <div />
        <div>{`${app.stack.length} ${Str.plural(app.stack.length, 'Layer', 'Layers')}`}</div>
      </div>

      {pushSample('sample-layer-0', Sample.sample0)}
      {pushSample('sample-layer-1', Sample.sample1)}
      {pushSample('sample: top-down', Sample.sample2)}

      <hr />
      {pushStackContentButtons(app)}

      <hr />
      {layerVideoPlayerButtons(app)}

      <hr />
      <div className={Styles.title.class}>{`Sample Configurations:`}</div>

      <Button
        block
        label={() => `- debug samples`}
        onClick={() => {
          app.stack.clear();
          app.stack.push(Sample.sample0());
          app.stack.push(Sample.sample1());
        }}
      />
      <Button
        block
        label={() => `- application ("SLC Product System")`}
        onClick={async () => {
          app.stack.clear();
          app.stack.push(await Content.factory('Entry'));
        }}
      />

      <hr />
      <ObjectView name={'state:app'} data={app} expand={0} margin={[null, null, 4, null]} />
      <ObjectView name={'stack'} data={app.stack.items} expand={1} />
    </div>
  );
};
