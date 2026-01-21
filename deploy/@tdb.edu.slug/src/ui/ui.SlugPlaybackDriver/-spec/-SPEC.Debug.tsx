import React from 'react';
import { LoadSample, SelectedPath } from '../../ui.TreeHost/-spec/mod.ts';
import { type t, Button, Color, css, D, LocalStorage, Obj, ObjectView, Signal } from '../common.ts';
import { SlugPlaybackDriver, TreeHost } from './mod.ts';

type P = t.TreeHostProps;
type Storage = Pick<P, 'debug' | 'theme' | 'selectedPath'> & { load?: t.SampleLoadAction };
const defaults: Storage = {
  debug: false,
  theme: 'Light',
  //
  load: 'esm:import',
};

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

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    tree: s<t.TreeViewNodeList | undefined>(),
    selectedPath: s(snap.selectedPath),
    //
    load: s(snap.load),
  };
  const p = props;
  const api = {
    props,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(props, true);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.selectedPath = p.selectedPath.value;
      //
      d.load = p.load.value;
    });
  });

  const load = () => void LoadSample.load(p.tree, p.load.value);
  Signal.effect(load);

  /** Observe to relevant changes */
  Signal.effect(() => {
    const path = p.selectedPath.value;
    const tree = p.tree.value;

    console.group(`👁️`);
    console.info('selectedPath:', path);
    const node = TreeHost.Data.findViewNode(tree, path);
    console.info('findViewNode(tree, path):', tree ? node : '(no tree)');
    console.groupEnd();
  });

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
  const p = debug.props;
  const v = Signal.toObject(p);
  Signal.useRedrawEffect(debug.listen);

  /**
   * Render:
   */
  const theme = Color.theme();
  const styles = {
    base: css({ color: theme.fg }),
    vcenter: css({ display: 'flex', alignItems: 'center', gap: 6 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <SlugPlaybackDriver.Dev.DriverInfo />

      <hr />
      <LoadSample.UI signal={p.load} style={{ MarginY: 15 }} />
      <hr />
      <SelectedPath theme={theme.name} signal={p.selectedPath} style={{ MarginY: 15 }} />

      <hr />
      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
