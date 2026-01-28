import React from 'react';
import { SelectedPath } from '../../ui.TreeHost/-spec/mod.ts';
import {
  type t,
  Url,
  SlugClient,
  Button,
  Color,
  css,
  D,
  EffectController,
  LocalStorage,
  Obj,
  ObjectView,
  Signal,
  TreeHost,
  SlugKbDriver,
} from './mod.ts';

type P = t.TreeHostProps;
type Storage = Pick<P, 'debug' | 'theme' | 'selectedPath'>;
const defaults: Storage = {
  debug: false,
  theme: 'Light',
};

const baseUrl = 'http://localhost:4040/publish.assets';

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = Awaited<ReturnType<typeof createDebugSignals>>;

/**
 * Signals:
 */
export async function createDebugSignals() {
  const s = Signal.create;
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const controller = SlugKbDriver.Controller.create({ baseUrl });

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    tree: s<P['tree']>(undefined),
    selectedPath: s(snap.selectedPath),
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
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.selectedPath = p.selectedPath.value;
    });
  });

  /**
   * Bridge (dev harness): Signals → EffectController
   * Feeds reactive harness inputs into the controller under test.
   */
  Signal.effect(() => {
    controller.next({
      tree: p.tree.value,
      selectedPath: p.selectedPath.value,
    });
  });

  return api;
}

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const controller = debug.controller;
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
      <SlugKbDriver.Dev.DriverInfo style={{ marginBottom: 15 }} controller={controller} />

      <SelectedPath theme={theme.name} signal={p.selectedPath} style={{ MarginY: 15 }} />

      <hr />
      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Button
        block
        label={() => `load 🐷`}
        onClick={async () => {
          const baseUrl = controller.props.baseUrl;
          const kb = 'kb';
          const filename = SlugClient.Url.treeFilename(kb);
          const url = Url.parse(baseUrl).join('manifests', filename);
          console.log('url', url);

          const res = await SlugClient.FromEndpoint.Tree.load(baseUrl, kb);
          console.log('res', res);
          if (res.ok) {
            p.tree.value = TreeHost.Data.fromSlugTree(res.value);
            controller.next({ error: undefined });
          } else {
            p.tree.value = undefined;
            controller.next({ error: { message: res.error.message } });
          }
        }}
      />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => '(reset)'} onClick={debug.reset} />

      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
      <ObjectView name={'state'} data={state} expand={0} style={{ marginTop: 6 }} />
    </div>
  );
};
