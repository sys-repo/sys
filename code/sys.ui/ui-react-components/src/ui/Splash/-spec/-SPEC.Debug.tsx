import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, Color, css, D, LocalStorage, Obj, pkg, Signal } from './common.ts';

const PkgFlags = ['not-specified', '@sys/ui-react-components', 'custom'] as const;

type P = t.Splash.Props;
type Storage = Pick<P, 'debug' | 'theme' | 'keyboardEnabled' | 'qs'> & {
  pkg?: (typeof PkgFlags)[number];
};
const defaults: Storage = {
  debug: false,
  theme: 'Light',
  keyboardEnabled: D.keyboardEnabled,
  pkg: '@sys/ui-react-components',
  qs: undefined,
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
    pkg: s(snap.pkg),
    qs: s(snap.qs),
    keyboardEnabled: s(snap.keyboardEnabled),
  };
  const p = props;
  const api = {
    props,
    listen,
    reset,
    get pkg(): P['pkg'] {
      const v = p.pkg.value;
      if (v === 'not-specified') return;
      if (v === '@sys/ui-react-components') return pkg;
      if (v === 'custom') return { name: '@scope/my-package', version: '0.1.2' };
    },
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
      d.pkg = p.pkg.value;
      d.qs = p.qs.value;
      d.keyboardEnabled = p.keyboardEnabled.value;
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
        label={() => `pkg: ${p.pkg.value}`}
        onClick={() => Signal.cycle(p.pkg, PkgFlags)}
      />
      <Button
        block
        label={() => `qs: ${p.qs.value ?? `(undefined) ← default: ${D.qs}`}`}
        onClick={() => Signal.cycle(p.qs, [undefined, 'foo', '?bar'])}
      />
      <Button
        block
        label={() => `keyboardEnabled: ${p.keyboardEnabled.value}`}
        onClick={() => Signal.toggle(p.keyboardEnabled)}
      />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={v} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
