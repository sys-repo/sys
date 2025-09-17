import React from 'react';
import { type t, Button, css, D, LocalStorage, Obj, ObjectView, Signal } from '../common.ts';

import { HelloPropsSchema, makePlan } from './-u.ts';
type P = t.Infer<typeof HelloPropsSchema>;

type Storage = Pick<P, 'theme' | 'debug' | 'name'>;
const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  name: 'World',
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

  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    name: s(snap.name),
    plan: s<t.Plan>(),
  };
  const p = props;
  const api = {
    props,
    reset,
    listen() {
      Signal.listen(props);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.name = p.name.value;
    });
  });

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
    updatePlan();
  }

  Signal.effect(updatePlan);
  function updatePlan() {
    const theme = p.theme.value;
    const debug = p.debug.value;
    const name = p.name.value;
    p.plan.value = makePlan({ theme, debug, name });
  }

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
      <div className={Styles.title.class}>
        <div>{'Sample Template:'}</div>
        <div>{'Catalog'}</div>
      </div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `name: ${p.name.value ?? `<undefined>`}`}
        onClick={() => Signal.cycle(p.name, ['World', 'Foo', undefined])}
      />

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
