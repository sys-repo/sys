import type React from 'react';
import { css, D, Dev, Is, LocalStorage, Obj, Signal, type t } from './common.ts';

const VIEWS = ['single', 'variants'] as const;
export type DebugView = (typeof VIEWS)[number];

type P = t.Button.Props;
type Storage = Pick<P, 'theme' | 'debug' | 'active'> & {
  enabled?: boolean;
  opacity?: t.Percent;
  view: DebugView;
};
const defaults: Storage = {
  theme: 'Dark',
  debug: true,
  enabled: D.enabled,
  active: D.active,
  opacity: undefined, // Let Button derive opacity from enabled until explicitly overridden.
  view: 'single',
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
    enabled: s<P['enabled']>(snap.enabled ?? defaults.enabled),
    active: s(snap.active ?? defaults.active),
    opacity: s<P['opacity']>(snap.opacity ?? defaults.opacity),
    view: s(snap.view ?? defaults.view),
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
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.active = p.active.value;
      d.view = p.view.value;

      // Callback modes are transient; persist serializable defaults instead.
      d.enabled = Is.func(p.enabled.value) ? defaults.enabled : p.enabled.value;
      d.opacity = Is.func(p.opacity.value) ? defaults.opacity : p.opacity.value;
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
  Signal.useRedrawEffect(debug.listen);

  /**
   * Render:
   */
  const styles = { base: css({}) };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Dev.Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <Dev.Button
        block
        label={() => {
          const v = p.enabled.value;
          return `enabled: ${Is.func(v) ? 'ƒ' : v}`;
        }}
        onClick={() => {
          const fn = () => false;
          Signal.cycle(p.enabled, [true, false, fn]);
        }}
      />

      <Dev.Button
        block
        label={() => `active: ${p.active.value}`}
        onClick={() => Signal.toggle(p.active)}
      />

      <Dev.Button
        block
        label={() => {
          const v = p.opacity.value;
          if (Is.func(v)) return 'opacity: ƒ';
          return Is.number(v) ? `opacity: ${v} (override)` : 'opacity: auto';
        }}
        onClick={() => {
          type F = t.Button.Prop.Callback<t.Percent>;
          const fn: F = (e) => (e.is.enabled ? (e.is.over ? 0.8 : 0.3) : 0.1);
          Signal.cycle(p.opacity, [undefined, 1, 0.1, fn]);
        }}
      />

      <hr />
      <Dev.Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Dev.Button
        block
        label={() => `view: ${p.view.value}`}
        onClick={() => Signal.cycle<DebugView>(p.view, VIEWS)}
      />
      <Dev.Button block label='(reset)' onClick={debug.reset} />
      <Dev.ObjectView name='debug' data={Signal.toObject(p)} expand={0} style={{ marginTop: 10 }} />
    </div>
  );
};
