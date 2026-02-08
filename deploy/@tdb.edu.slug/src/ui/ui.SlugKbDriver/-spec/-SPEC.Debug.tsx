import React from 'react';
import { Dev } from '../../-dev/mod.ts';
import { SelectedPath, LoadSample } from '../../ui.TreeHost/-spec/mod.ts';
import {
  Button,
  Color,
  css,
  D,
  EffectController,
  Is,
  LocalStorage,
  Obj,
  ObjectView,
  Signal,
  SlugKbDriver,
  type t,
  TreeHost,
} from './mod.ts';

type P = t.TreeHostProps;
type Storage = Pick<P, 'debug' | 'theme' | 'selectedPath'> & {
  load?: t.SampleLoadAction;
  env?: t.HttpOriginEnv;
};
const defaults: Storage = {
  debug: false,
  theme: 'Light',
  load: 'esm:import',
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = Awaited<ReturnType<typeof createDebugSignals>>;

const docid = 'kb';

/**
 * Signals:
 */
export async function createDebugSignals() {
  const s = Signal.create;
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const defaultBaseUrl = LoadSample.SAMPLES.baseUrl;
  const controller = s(SlugKbDriver.Controller.create({ baseUrl: defaultBaseUrl }));

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    tree: s<P['tree']>(undefined),
    selectedPath: s(snap.selectedPath),
    env: s(snap.env),
    origin: s<t.SlugUrlOrigin | undefined>(),
    //
    load: s(snap.load),
  };
  const p = props;
  const api = {
    props,
    controller,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(props, true);
    Signal.listen({ controller }, true);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.selectedPath = p.selectedPath.value;
      d.load = p.load.value;
      d.env = p.env.value;
    });
  });

  Signal.effect(() => {
    if (Is.localhost()) return;
    if (p.env.value === 'localhost') p.env.value = 'production';
  });

  Signal.effect(() => {
    const baseUrl = p.origin.value?.app ?? defaultBaseUrl;
    const prev = controller.value;
    if (prev.props.baseUrl === baseUrl) return;
    const next = SlugKbDriver.Controller.create({ baseUrl });
    controller.value = next;
    prev.dispose();
  });

  const load = () => {
    const baseUrl = controller.value.props.baseUrl;
    void LoadSample.load(p.tree, p.load.value, { baseUrl, docid });
  };
  Signal.effect(load);

  /**
   * Bridge (dev harness): Signals → EffectController
   * Feeds reactive harness inputs into the controller under test.
   */
  Signal.effect(() => {
    const tree = p.tree.value;
    const selectedPath = p.selectedPath.value;
    controller.value.next({ tree, selectedPath });
  });

  return api;
}

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const controller = debug.controller.value;
  const p = debug.props;
  const v = Signal.toObject(p);

  Signal.useRedrawEffect(debug.listen);
  const state = EffectController.useEffectController(controller);

  /**
   * Render:
   */
  const theme = Color.theme();
  const styles = {
    base: css({ color: theme.fg }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Dev.SlugOrigin.UI debug={v.debug} env={p.env} origin={p.origin} style={{ marginTop: 10 }} />
      <hr />
      <SlugKbDriver.Dev.DriverInfo style={{ MarginY: [10, 50] }} controller={controller} />

      <hr style={{ borderTopWidth: 4, opacity: 0.5 }} />
      <LoadSample.UI
        signal={p.load}
        style={{ MarginY: 15 }}
        url={{ base: controller.props.baseUrl, docid }}
      />
      <hr />
      <SelectedPath theme={theme.name} signal={p.selectedPath} style={{ MarginY: 15 }} />

      <hr style={{ borderTopWidth: 4, opacity: 0.5 }} />

      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => '(reset)'} onClick={debug.reset} />

      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
      <ObjectView name={'state'} data={state} expand={0} style={{ marginTop: 6 }} />
    </div>
  );
};
