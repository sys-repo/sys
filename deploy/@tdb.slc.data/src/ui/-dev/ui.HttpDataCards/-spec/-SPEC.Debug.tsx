import React from 'react';
import {
  type t,
  Button,
  Color,
  css,
  D,
  HttpOrigin,
  HttpOriginRoutes,
  LocalStorage,
  Mounts,
  Obj,
  ObjectView,
  Signal,
} from './common.ts';

const LOCAL_SPEC = {
  localhost: HttpOriginRoutes.origin.localhost,
  production: HttpOriginRoutes.origin.production,
} satisfies t.HttpOrigin.SpecMap;

type P = t.HttpDataCards.Props;
type Storage = {
  debug?: boolean;
  theme?: t.CommonTheme;
  env?: t.HttpOriginBase.Env;
  integrity?: boolean;
  dataset?: t.StringId;
};
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
  env: 'production',
  integrity: false,
};

/**
 * Types:
 */
export type DebugProps = {
  debug: DebugSignals;
  origin?: t.StringUrl;
  style?: t.CssInput;
};
export type DebugSignals = Awaited<ReturnType<typeof createDebugSignals>>;

/**
 * Signals:
 */
export function createDebugSignals(params: t.HttpDataCardsSpecParams | void = {}) {
  const s = Signal.create;
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;
  const originSpec = params?.originSpec ?? LOCAL_SPEC;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    env: s(snap.env),
    integrity: s(snap.integrity ?? false),
    origin: s<t.UrlTree | undefined>(undefined),
    dataset: s(snap.dataset),
  };
  const p = props;
  const api = {
    originSpec,
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
      d.env = p.env.value;
      d.integrity = p.integrity.value;
      d.dataset = p.dataset.value;
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
  const origin = wrangle.origin(v.origin);
  const originSpec = debug.originSpec;

  /**
   * Render:
   */
  const theme = Color.theme('Light');
  const styles = {
    base: css({ color: theme.fg }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <HttpOrigin.UI.Controlled
        env={p.env}
        origin={p.origin}
        spec={originSpec}
        verify={v.integrity ? true : undefined}
        theme={theme.name}
        style={{ MarginY: 20 }}
      />
      {origin && <div className={Styles.title.class}>{'Mounts'}</div>}
      {origin && (
        <Mounts.UI
          origin={origin}
          selected={v.dataset}
          onSelect={(next) => (p.dataset.value = next)}
          theme={theme.name}
          style={{ marginBottom: 20 }}
        />
      )}
      <hr />

      <Button
        block
        theme={theme.name}
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <Button
        block
        theme={theme.name}
        label={() => `integrity: ${v.integrity}`}
        onClick={() => Signal.toggle(p.integrity)}
      />

      <Button
        block
        theme={theme.name}
        label={() => `debug: ${v.debug}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button block theme={theme.name} label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={v} expand={0} theme={theme.name} style={{ marginTop: 20 }} />
    </div>
  );
};

const wrangle = {
  origin(input: t.UrlTree | undefined): t.StringUrl | undefined {
    if (typeof input === 'string') return input;
    if (!input || typeof input !== 'object') return undefined;
    const proxy = 'proxy' in input ? input.proxy : undefined;
    return typeof proxy === 'string' ? proxy : undefined;
  },
} as const;
