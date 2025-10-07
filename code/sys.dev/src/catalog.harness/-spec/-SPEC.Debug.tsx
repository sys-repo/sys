import React from 'react';
import { createRepo } from '../../ui/-test.ui.ts';
import { type t, Button, Crdt, css, D, LocalStorage, Obj, ObjectView, Signal } from './common.ts';

import { makeRoot } from './-u.make.tsx';
import { StateChooser } from './-ui.StateChooser.tsx';

type Storage = {
  theme?: t.CommonTheme;
  debug?: boolean;
  stateKind?: (typeof D.STATE_KINDS)[number];
};
const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  stateKind: 'local-storage',
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;

  const store = LocalStorage.immutable<Storage>(D.STORAGE_KEY.DEV.LOCAL, defaults);
  const snap = store.current;

  const props = {
    redraw: s(0),
    debug: s(snap.debug),
    theme: s(snap.theme),
    stateKind: s(snap.stateKind),
    stateCrdt: s<t.Crdt.Ref>(),
    catalog: s<ReturnType<typeof makeRoot>>(),
  };
  let _repo: t.Crdt.Repo;
  const p = props;
  const api = {
    props,
    reset,
    listen: () => Signal.listen(props),
    redraw: () => (p.redraw.value += 1),
    localstorage: LocalStorage.immutable<{}>(D.STORAGE_KEY.DEV.CRDT, {}),
    get repo() {
      return _repo || (_repo = createRepo());
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.stateKind = p.stateKind.value;
    });
  });

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

  /**
   * Sync:
   */
  Signal.effect(() => {
    const stateKind = p.stateKind.value;
    const theme = p.theme.value;
    const debug = p.debug.value;
    p.stateCrdt.value?.instance;

    function currentState() {
      if (stateKind === 'crdt') return p.stateCrdt.value;
      if (stateKind === 'local-storage') return api.localstorage;
    }

    const state = currentState();
    p.catalog.value = makeRoot({ state, theme, debug });
  });

  api.localstorage.events().$.subscribe(api.redraw);

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
  const stateKind = p.stateKind.value;

  Signal.useRedrawEffect(() => debug.listen());
  Crdt.UI.useRev(p.stateCrdt.value);

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{`catalog: ${D.name}`}</div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <div className={Styles.title.class}>{'State'}</div>
      <StateChooser debug={debug} style={{ marginBottom: 20 }} />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button block label={() => `(reset)`} onClick={() => debug.reset()} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 10 }} />
      <ObjectView
        name={'state.localstorage'}
        data={debug.localstorage.current}
        style={{ marginTop: 5, opacity: stateKind === 'local-storage' ? 1 : 0.4 }}
        expand={0}
      />
      <ObjectView
        name={'state.crdt'}
        data={p.stateCrdt?.value?.current}
        style={{ marginTop: 5, opacity: stateKind === 'crdt' ? 1 : 0.4 }}
        expand={0}
      />
    </div>
  );
};
