import React from 'react';
import { Foo } from '../../-test.ui.ts';
import { type t, Button, Color, css, D, LocalStorage, Obj, ObjectView, Signal } from '../common.ts';
import { LoadSample, SelectedPath, TreeHost } from './mod.ts';

type P = t.TreeHostProps;
type Storage = Pick<P, 'debug' | 'theme' | 'split' | 'selectedPath'> & {
  load?: t.SampleLoadAction;
  customEmpty?: boolean;
};
const defaults: Storage = {
  debug: false,
  theme: 'Light',
  split: D.split,
  //
  load: 'esm:import',
  customEmpty: false,
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

  type S = t.TreeHostSlots;
  const slots = {
    tree: s<S['tree']>(),
    main: s<S['main']>(),
    aux: s<S['aux']>(),
  };

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    tree: s<P['tree']>(undefined),
    split: s(snap.split),
    selectedPath: s(snap.selectedPath),
    slots,
    //
    load: s(snap.load),
    customEmpty: s(snap.customEmpty),
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
    Signal.walk(props, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
    load();
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.split = p.split.value;
      d.selectedPath = p.selectedPath.value;
      //
      d.load = p.load.value;
      d.customEmpty = p.customEmpty.value;
    });
  });

  const baseUrl = LoadSample.baseUrl;
  const load = () => void LoadSample.load(p.tree, p.load.value, { baseUrl });
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
    marginBottom: 4,
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
  const selectedPath = v.selectedPath ?? [];

  Signal.useRedrawEffect(debug.listen);

  /**
   * Render:
   */
  const theme = Color.theme();
  const styles = {
    base: css({ color: theme.fg }),
    vcenter: css({ display: 'flex', alignItems: 'center', gap: 6 }),
    mono: css({
      fontFamily: 'monospace',
      fontSize: 11,
      fontWeight: 600,
      lineHeight: 1.2,
    }),
  };

  function slotButton(slot: keyof typeof p.slots) {
    const current = () => p.slots[slot].value;
    return (
      <Button
        block
        label={() => `slot: ${slot} ${current() ? '🐚' : ''}`}
        onClick={() => {
          const el = <Foo theme={p.theme.value} label={`slot:${slot}`} />;
          p.slots[slot].value = !!current() ? undefined : el;
        }}
      />
    );
  }

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <LoadSample.UI theme={theme.name} signal={p.load} style={{ MarginY: 15 }} />
      <hr />
      <SelectedPath theme={theme.name} signal={p.selectedPath} style={{ MarginY: 15 }} />

      <hr />
      {slotButton('tree')}
      {slotButton('main')}
      {slotButton('aux')}
      <Button
        block
        label={() => `slot: empty ${p.customEmpty.value ? '🐚' : ''}`}
        onClick={() => Signal.toggle(p.customEmpty)}
      />
      <Button
        block
        label={() => `(reset)`}
        onClick={() => {
          Signal.walk(p.slots, (e) => e.mutate(undefined));
          p.customEmpty.value = undefined;
        }}
      />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
