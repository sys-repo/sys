import React from 'react';
import { type t, Button, Color, css, D, LocalStorage, Obj, ObjectView, Signal } from '../common.ts';
import { SlugSheet } from '../mod.ts';
import { createSlots } from './u.fixture.tsx';

type P = t.SlugSheetProps;

export type Storage = Pick<P, 'debug' | 'theme' | 'visible' | 'index'> & {
  slots?: 'Foo' | 'TreeHost';
  controlled?: boolean;
};
const defaults: Storage = {
  debug: false,
  theme: 'Light',
  visible: D.visible,
  index: D.index,
  //
  controlled: true,
  slots: 'Foo',
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

  const controller = SlugSheet.Controller.create({
    props() {
      const slots = createSlots(p.slots.value, p.theme.value);
      return { slots };
    },
  });

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    visible: s(snap.visible),
    index: s(snap.index),
    //
    slots: s(snap.slots),
    controlled: s(snap.controlled),
  };
  const p = props;
  const api = {
    props,
    controller,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(props);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.index = p.index.value;
      d.visible = p.visible.value;
      d.slots = p.slots.value;
      d.controlled = p.controlled.value;
    });
  });

  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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

  function indexButton(inc: number) {
    return (
      <Button
        block
        label={() => `index = ${p.index.value} ${inc > 0 ? '+' : '-'} ${Math.abs(inc)}`}
        onClick={() => {
          const current = p.index.value ?? 0;
          p.index.value = current + inc;
        }}
      />
    );
  }

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>
      <Button
        block
        label={() => (p.controlled.value ? 'controlled' : 'uncontrolled')}
        onClick={() => Signal.toggle(p.controlled)}
      />

      <hr />
      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `visible: ${p.visible.value ?? `(undefined)`}`}
        onClick={() => Signal.toggle(p.visible)}
      />

      <hr />
      {indexButton(1)}
      {indexButton(-1)}
      <Button block label={() => `reset (index = 0)`} onClick={() => (p.index.value = 0)} />

      <hr />
      <Button
        block
        label={() => `slots: ${p.slots.value ?? '(undefined)'}`}
        onClick={() => Signal.cycle<Storage['slots']>(p.slots, ['Foo', 'TreeHost', undefined])}
      />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
