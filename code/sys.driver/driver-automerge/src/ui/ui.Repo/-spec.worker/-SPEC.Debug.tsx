import React from 'react';
import { spawnUiRepoWorker } from '../../-test.ui.ts';
import {
  type t,
  Button,
  Color,
  Crdt,
  css,
  D,
  Delete,
  LocalStorage,
  Obj,
  ObjectView,
  Rx,
  Signal,
} from '../common.ts';
import { Repo } from '../mod.ts';

type Storage = { debug?: boolean; theme?: t.CommonTheme };
const defaults: Storage = {
  theme: 'Dark',
  debug: false,
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
  const life = Rx.lifecycle();
  const s = Signal.create;

  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;
  const repo = await spawnUiRepoWorker();

  const props = {
    rev: s(0),
    debug: s(snap.debug),
    theme: s(snap.theme),
  };
  const p = props;
  const api = {
    life,
    props,
    repo,
    reset,
    listen,
    redraw,
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
  const p = debug.props;
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
      <div className={Styles.title.class}>
        <div className={styles.vcenter.class}>
          {D.name}
          <Repo.StatusBullet repo={debug.repo} style={{}} />
        </div>
        <div>{`( Worker-Proxy )`}</div>
      </div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
      <ObjectView
        name={'repo'}
        data={Delete.funcs(debug.repo)}
        style={{ marginTop: 10 }}
        expand={1}
      />

      <hr />
      <Repo.Info repo={repo} style={{ MarginX: [20], marginTop: 40 }} />
    </div>
  );
};
