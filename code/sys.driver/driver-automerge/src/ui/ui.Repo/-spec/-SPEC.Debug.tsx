import React from 'react';
import { createRepo } from '../../-test.ui.ts';
import { ServerInfo } from '../../../m.Server.client/mod.ts';
import {
  type t,
  Button,
  css,
  D,
  LocalStorage,
  Obj,
  ObjectView,
  Signal,
  STORAGE_KEY,
} from '../common.ts';

type P = t.SyncEnabledSwitchProps;
type Storage = Pick<P, 'theme' | 'debug' | 'localstorage' | 'mode'> & { noRepo?: boolean };
const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  noRepo: false,
  localstorage: STORAGE_KEY.DEV.SUBJECT,
  mode: D.mode,
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

  const store = LocalStorage.immutable<Storage>(STORAGE_KEY.DEV.SPEC, defaults);
  const snap = store.current;

  const props = {
    redraw: s(0),
    debug: s(snap.debug),
    theme: s(snap.theme),
    localstorage: s(snap.localstorage),
    mode: s(snap.mode),
    noRepo: s(snap.noRepo),
  };
  const p = props;
  const repo = createRepo();
  const api = {
    props,
    repo,
    reset,
    listen() {
      Signal.listen(props);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.noRepo = p.noRepo.value;
      d.localstorage = p.localstorage.value;
      d.mode = p.mode.value;
    });
  });

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

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
  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `mode: ${p.mode.value ?? `<undefined> (default)`}`}
        onClick={() => {
          Signal.cycle<P['mode']>(p.mode, ['switch-only', 'switch + network-icons', undefined]);
        }}
      />

      <hr />
      <Button
        block
        label={() => `ServerInfo.get`}
        onClick={async () => {
          const urls = debug.repo.sync.urls.map((text) => {
            const url = new URL(text);
            const protocol = url.protocol === 'ws:' ? 'http:' : 'https:';
            return `${protocol}//${url.host}`;
          });

          for (const url of urls) {
            const res = await ServerInfo.get(url);
            console.group(`🌳 ServerInfo.get`);
            console.log('url', url);
            console.log(res);
            console.groupEnd();
          }
        }}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `debug: no-repo: ${p.noRepo.value}`}
        onClick={() => Signal.toggle(p.noRepo)}
      />

      <Button
        block
        label={() => {
          const v = p.localstorage.value;
          return `debug: localstorage: ${v ? `"${v}"` : '(none)'}`;
        }}
        onClick={() => {
          const s = p.localstorage;
          s.value = s.value ? undefined : STORAGE_KEY.DEV.SUBJECT;
        }}
      />
      <Button block label={() => `(reset)`} onClick={() => debug.reset()} />

      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 15 }} />
      <ObjectView name={'repo'} data={debug.repo} expand={0} style={{ marginTop: 5 }} />
    </div>
  );
};
