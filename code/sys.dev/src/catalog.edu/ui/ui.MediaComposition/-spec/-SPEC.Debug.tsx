import React from 'react';
import {
  type t,
  Button,
  Color,
  css,
  D,
  LocalStorage,
  Obj,
  ObjectView,
  Signal,
  Crdt,
} from '../common.ts';

type P = t.MediaCompositionProps;
type Storage = Pick<P, 'debug' | 'theme'>;
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
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

  const worker = new Worker(new URL('./-u.worker.ts', import.meta.url), { type: 'module' });
  const { repo } = await Crdt.Worker.spawn(worker);

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    doc: s<t.Crdt.Ref>(),
  };
  const p = props;
  const api = {
    props,
    repo,
    reset,
    listen,
  };

  function listen() {
    Signal.listen(props);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
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
  const v = Signal.toObject(p);
  const repo = debug.repo;
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
      <Crdt.UI.Repo.Info repo={repo} style={{ marginBottom: 50 }} />

      {/* <hr /> */}
      <div className={Styles.title.class}>{D.name}</div>

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
        name={v.doc ? `doc(${v.doc.id.slice(-5)})` : `doc`}
        data={Obj.trimStringsDeep(Signal.toObject(v.doc?.current))}
        expand={0}
        style={{ marginTop: 10 }}
      />
    </div>
  );
};
