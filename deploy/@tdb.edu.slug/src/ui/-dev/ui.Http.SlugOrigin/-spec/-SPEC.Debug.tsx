import React from 'react';
import { type t, Button, Color, css, D, LocalStorage, Obj, ObjectView, Signal } from '../common.ts';
import { SlugOrigin } from '../mod.ts';

type DomainName = 'slc.db.team' | 'socialleancanvas.com';
type P = t.SlugHttpOriginProps;
type Storage = Pick<P, 'debug' | 'theme'> & {
  env?: t.HttpOriginEnv;
  domain?: DomainName;
};
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
  env: 'localhost',
  domain: D.domain,
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
    env: s(snap.env),
    domain: s(snap.domain),
    origin: s<t.SlugLoaderOrigin | undefined>(),
    spec: s<t.SlugHttpOriginsSpecMap>(),
  };
  const p = props;
  const api = {
    props,
    listen,
    reset,
  };

  Signal.effect(() => {
    const port = D.port;
    const domain = p.domain.value ?? D.domain;
    const spec = SlugOrigin.Origin.create(port, domain);
    p.spec.value = spec;
  });

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
      d.domain = p.domain.value;
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
        label={() => `env: ${p.env.value ?? `(undefined)`}`}
        onClick={() => {
          return Signal.cycle<t.HttpOriginEnv | undefined>(p.env, ['localhost', 'production']);
        }}
      />
      <Button
        block
        label={() => `domain: ${p.domain.value}`}
        onClick={() => Signal.cycle<DomainName>(p.domain, ['slc.db.team', 'socialleancanvas.com'])}
      />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
      <ObjectView name={'origin:spec'} data={v.spec} expand={2} style={{ marginTop: 6 }} />

      <hr />

      <SlugOrigin.UI env={p.env} origin={p.origin} style={{ marginTop: 20 }} />
    </div>
  );
};
