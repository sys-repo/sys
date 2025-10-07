import React from 'react';
import { SampleFactory } from '../../-sample.factory/mod.ts';
import { createRepo } from '../../-test.ui.ts';

import { type t, Button, Crdt, css, D, LocalStorage, Obj, ObjectView, Signal } from '../common.ts';
import { createSignals } from '../mod.ts';

type P = t.SampleProps;
type Storage = Pick<P, 'theme' | 'debug'> & { debugMargin?: boolean };
const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  debugMargin: false,
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
    debugMargin: s(snap.debugMargin),
    factory: s<t.Factory>(SampleFactory),
  };
  const repo = createRepo();
  const signals = createSignals();
  const p = props;
  const api = {
    Crdt,
    props,
    repo,
    signals,
    listen() {
      signals.listen();
      Signal.listen(props);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.debugMargin = p.debugMargin.value;
    });
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
  const signals = debug.signals;
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
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `margin: ${p.debugMargin.value}`}
        onClick={() => Signal.toggle(p.debugMargin)}
      />

      <Button
        block
        label={() => `tmp ( 🐷 )`}
        onClick={() => {
          const doc = signals.doc.value;
          doc?.change((d) => {
            // Obj.Path.Mutate.delete(d, ['foo.parsed1']);
          });
        }}
      />
      <Button
        block
        label={() => `(reset)`}
        onClick={() => {
          p.debug.value = defaults.debug;
          p.debugMargin.value = defaults.debugMargin;
          p.theme.value = defaults.theme;
        }}
      />

      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 15 }} />
      <ObjectView
        name={'signals'}
        data={{
          ...Signal.toObject(signals),
          doc: Obj.trimStringsDeep(signals.doc.value?.current ?? {}),
        }}
        expand={['$']}
        style={{ marginTop: 5 }}
      />
    </div>
  );
};
