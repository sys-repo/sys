import React from 'react';
import { createRepo } from '../../ui/-test.ui.ts';
import { type t, Button, css, D, LocalStorage, Obj, ObjectView, Signal, Time } from './common.ts';

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

  const storeKey = `dev:${D.displayName}`;
  const store = LocalStorage.immutable<Storage>(storeKey, defaults);
  const snap = store.current;

  const props = {
    redraw: s(0),
    debug: s(snap.debug),
    theme: s(snap.theme),
    stateKind: s(snap.stateKind),
    catalog: s<ReturnType<typeof makeRoot>>(),
  };
  const repo = createRepo();
  const p = props;
  const api = {
    props,
    repo,
    reset,
    listen: () => Signal.listen(props),
    redraw: () => (p.redraw.value += 1),
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

  Signal.effect(() => {
    //
    const stateKind = p.stateKind.value;
    //     // const state = stateKind === 'crdt' ? repo : undefined;
    const catalog = makeRoot({ localstorageKey: `${storeKey}.catalog` });
    p.catalog.value = catalog;

    //     // p.rootElement.value = catalog.element;
    //     _elRoot = catalog.element;
    //     // api.redraw();
    //
    //     console.log('_elRoot', _elRoot);
    // Time.delay(api.redraw);
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
  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <StateChooser debug={debug} />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button block label={() => `(reset)`} onClick={() => debug.reset()} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 10 }} />
    </div>
  );
};
