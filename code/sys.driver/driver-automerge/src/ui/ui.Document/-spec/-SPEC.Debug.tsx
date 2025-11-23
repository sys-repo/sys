import React from 'react';
import { spawnUiRepoWorker } from '../../-test.ui.ts';
import { Repo } from '../../ui.Repo/mod.ts';
import {
  type t,
  Button,
  Color,
  css,
  D,
  LocalStorage,
  Obj,
  ObjectView,
  Rx,
  Signal,
  STORAGE_KEY,
} from '../common.ts';

type P = t.DocumentProps;
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
type Doc = { count?: number };

/**
 * Signals:
 */
export async function createDebugSignals() {
  const life = Rx.lifecycle();
  const s = Signal.create;

  const store = LocalStorage.immutable<Storage>(STORAGE_KEY.DEV, defaults);
  const snap = store.current;
  const { repo } = await spawnUiRepoWorker();

  const props = {
    rev: s(0),
    debug: s(snap.debug),
    theme: s(snap.theme),
    doc: s<t.Crdt.Ref<Doc>>(),
    render: s(true),
  };
  const p = props;
  const api = {
    life,
    props,
    reset,
    listen,
    redraw,
    repo,
  };

  function listen() {
    Signal.listen(props);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

  function redraw() {
    p.rev.value += 1;
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
    });
  });

  repo.events(life).$.pipe(Rx.debounceTime(100)).subscribe(redraw);
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
  const repo = debug.repo;
  const p = debug.props;
  const v = Signal.toObject(p);
  const doc = v.doc;

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
      <Repo.Info repo={repo} />

      <hr style={{ marginTop: 20, marginBottom: 20 }} />
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `render: ${p.render.value}`}
        onClick={() => Signal.toggle(p.render)}
      />

      <hr />

      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Button
        block
        label={() => `change: increment`}
        onClick={() => doc?.change((d) => (d.count = (d.count ?? 0) + 1))}
      />
      <Button
        block
        label={() => `change: decrement`}
        onClick={() => doc?.change((d) => (d.count = (d.count ?? 0) - 1))}
      />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
      <ObjectView
        name={'doc'}
        data={Obj.truncateStrings(Signal.toObject(p.doc.value?.current))}
        style={{ marginTop: 10 }}
        expand={1}
      />
    </div>
  );
};
