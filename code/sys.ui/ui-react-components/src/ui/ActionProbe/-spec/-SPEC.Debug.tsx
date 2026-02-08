import React from 'react';
import { type t, Button, Color, css, D, LocalStorage, Obj, ObjectView, Signal } from '../common.ts';
import { ActionProbe } from '../mod.ts';
import { renderSamples } from './-u.samples.tsx';

type Storage = {
  debug?: boolean;
  theme?: t.CommonTheme;
  env?: 'localhost' | 'production';
  actOn?: 'Enter' | 'Cmd+Enter' | null;
};
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
  env: 'localhost',
  actOn: undefined,
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
  const action = ActionProbe.Signals.create();

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    env: s(snap.env),
    actOn: s<Storage['actOn']>(snap.actOn),
    ...action.props,
  };
  const p = props;
  const api = {
    props,
    action,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(props, true);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
    action.reset();
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.env = p.env.value;
      d.actOn = p.actOn.value;
    });
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
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `actOn: ${wrangle.actOnLabel(v.actOn)} ← when focused`}
        onClick={() => Signal.cycle<Storage['actOn']>(p.actOn, ['Enter', 'Cmd+Enter', null])}
      />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />

      <hr style={{ marginTop: 10, marginBottom: 10 }} />

      <div className={Styles.title.class} style={{ marginBottom: 15 }}>
        <div>{'Sample Probes:'}</div>
      </div>
      {renderSamples(debug, { theme: theme.name })}
    </div>
  );
};

const wrangle = {
  actOnLabel(value: Storage['actOn']) {
    if (value === undefined) return '(default: Enter)';
    if (value === null) return '(none)';
    return value;
  },
} as const;
