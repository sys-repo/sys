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
  SlugClient,
  Str,
} from '../common.ts';
import { Data } from '../m.Data.ts';

import sample from './-sample/slug-tree.21JvXzARPYFXDVMag3x4UhLgHcQi.json' with { type: 'json' };

type P = t.LayoutTreeSplitProps;
type Storage = Pick<P, 'debug' | 'theme' | 'split' | 'path'> & {
  load?: 'import' | 'http';
};
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
  split: D.split,
  load: 'import',
  path: undefined,
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
    root: s<P['root']>(undefined),
    debug: s(snap.debug),
    theme: s(snap.theme),
    split: s(snap.split),
    load: s(snap.load),
    path: s(snap.path),
  };
  const p = props;
  const api = {
    props,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(props);
  }

  function reset() {
    Signal.walk(props, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.split = p.split.value;
      d.load = p.load.value;
      d.path = p.path.value;
    });
  });

  let httpRequestNonce = 0;
  Signal.effect(() => {
    const load = p.load.value;

    if (!load) return void (p.root.value = undefined);
    if (load === 'import') {
      p.root.value = Data.fromSlugTree(sample as t.SlugTreeProps);
      return;
    }

    if (load === 'http') {
      const thisRequest = ++httpRequestNonce; // ← move here
      const baseUrl = 'http://localhost:4040/publish.assets';
      const docId = '21JvXzARPYFXDVMag3x4UhLgHcQi';
      SlugClient.loadTreeFromEndpoint(baseUrl, docId).then((res) => {
        if (thisRequest !== httpRequestNonce) return; // ← ignore stale
        p.root.value = res.ok ? Data.fromSlugTree(res.value) : undefined;
        if (!res.ok) console.info('[SlugClient] failed to load slug-tree via HTTP', res.error);
      });
    }
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

      <hr />
      <div className={Styles.title.class}>{'sample:'}</div>
      <Button
        block
        label={() => `load: slug-tree ← sample import ${p.load.value === 'import' ? '🌳' : ''}`}
        onClick={() => (p.load.value = 'import')}
      />
      <Button
        block
        label={() => `load: slug-tree ← via HTTP ${p.load.value === 'http' ? '🌳' : ''}`}
        onClick={() => (p.load.value = 'http')}
      />
      <Button block label={() => `(unload)`} onClick={() => (p.load.value = undefined)} />

      <hr />
      <Button
        block
        label={() => {
          const path = v.path ? Str.ellipsize(Obj.Path.encode(v.path), 30) : '(none)';
          return `clear path: ${path}`;
        }}
        onClick={() => (p.path.value = undefined)}
      />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
