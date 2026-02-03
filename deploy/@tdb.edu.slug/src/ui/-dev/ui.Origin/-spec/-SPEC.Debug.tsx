import React from 'react';
import {
  type t,
  Button,
  ClientLoader,
  Color,
  css,
  D,
  LocalStorage,
  Obj,
  ObjectView,
  Signal,
} from '../common.ts';
import { DevOrigin } from '../mod.ts';

type P = t.DevOriginProps;
type Storage = Pick<P, 'debug' | 'theme' | 'kind'> & { controlled?: boolean };
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
  kind: 'localhost',
  controlled: false,
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
    kind: s(snap.kind),
    origin: s<t.SlugLoaderOrigin | undefined>(),
    controlled: s(snap.controlled),
  };
  const p = props;
  const controller = DevOrigin.controller({ kind: p.kind, origin: p.origin });
  const api = {
    props,
    controller,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(props, true);
    controller.listen();
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.kind = p.kind.value;
      d.controlled = p.controlled.value;
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
  const ctrl = debug.controller;
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
        label={() => `controlled: ${p.controlled.value}`}
        onClick={() => Signal.toggle(p.controlled)}
      />
      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
      <ObjectView
        name={`controller:rev:${ctrl.rev}`}
        data={Signal.toObject(ctrl, { func: false })}
        style={{ marginTop: 6 }}
        expand={1}
      />

      <hr style={{ margin: '15px 0 20px 0' }} />
      <DevOrigin.UI.Controlled debug={v.debug} origin={p.origin} />

      <hr style={{ margin: '15px 0 20px 0' }} />
      <Button
        block
        label={() => `tmp 🐷`}
        onClick={async () => {
          const origin = ctrl.state.origin.value;
          if (origin) {
            const loader = ClientLoader.make({ origin });
            const m = await loader.Tree.load('kv');
            console.log('m', m);
          }
        }}
      />
    </div>
  );
};
