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
import { Foo } from './-ui.Foo.tsx';

import sample from './-sample/slug-tree.21JvXzARPYFXDVMag3x4UhLgHcQi.json' with { type: 'json' };
const SAMPLE = {
  baseUrl: 'http://localhost:4040/publish.assets',
  tree: { docId: '21JvXzARPYFXDVMag3x4UhLgHcQi' },
} as const;

type P = t.TreeHostProps;
type LoadAction = 'import' | 'http';
type Storage = Pick<P, 'debug' | 'theme' | 'split' | 'selectedPath'> & {
  load?: LoadAction;
  customEmpty?: boolean;
};
const defaults: Storage = {
  debug: false,
  theme: 'Light',
  split: D.split,
  selectedPath: undefined,
  load: 'import',
  customEmpty: false,
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

  type S = t.TreeHostSlots;
  const slots = {
    tree: s<S['tree']>(),
    main: s<S['main']>(),
    aux: s<S['aux']>(),
  };

  const props = {
    root: s<P['root']>(undefined),
    debug: s(snap.debug),
    theme: s(snap.theme),
    split: s(snap.split),
    selectedPath: s(snap.selectedPath),
    slots,
    load: s(snap.load),
    customEmpty: s(snap.customEmpty),
  };
  const p = props;
  const api = {
    props,
    listen,
    reset,
    load,
  };

  function listen() {
    Signal.listen(props, true);
  }

  function reset() {
    Signal.walk(props, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
    load(p.load.value);
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.split = p.split.value;
      d.selectedPath = p.selectedPath.value;
      d.load = p.load.value;
      d.customEmpty = p.customEmpty.value;
    });
  });

  let httpRequestNonce = 0;
  Signal.effect(() => void load(p.load.value));
  async function load(action?: LoadAction) {
    if (!action) return void (p.root.value = undefined);
    if (action === 'import') {
      p.root.value = Data.fromSlugTree(sample as t.SlugTreeProps);
      return;
    }
    if (action === 'http') {
      const thisRequest = ++httpRequestNonce; // ← move here
      const baseUrl = SAMPLE.baseUrl;
      const docId = SAMPLE.tree.docId;
      SlugClient.loadTreeFromEndpoint(baseUrl, docId).then((res) => {
        if (thisRequest !== httpRequestNonce) return; // ← ignore stale
        p.root.value = res.ok ? Data.fromSlugTree(res.value) : undefined;
        if (!res.ok) console.info('[SlugClient] failed to load slug-tree via HTTP', res.error);
      });
    }
  }

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
    mono: css({
      fontFamily: 'monospace',
      fontSize: 11,
      fontWeight: 600,
    }),
  };

  function slotButton(slot: keyof typeof p.slots) {
    const current = () => p.slots[slot].value;
    return (
      <Button
        block
        label={() => `slot: ${slot} ${current() ? '🐚' : ''}`}
        onClick={() => {
          const el = <Foo theme={p.theme.value} label={`slot:${slot}`} />;
          p.slots[slot].value = !!current() ? undefined : el;
        }}
      />
    );
  }

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
      <div className={Styles.title.class}>
        <div>{'selected'}</div>
        <div>{'[ path ]'}</div>
      </div>
      <div>
        <span className={styles.mono.class}>
          {v.selectedPath ? Str.ellipsize(Obj.Path.encode(v.selectedPath), 50) : '(no path)'}
        </span>
      </div>
      <Button block label={() => 'clear'} onClick={() => (p.selectedPath.value = undefined)} />

      <hr />
      {slotButton('tree')}
      {slotButton('main')}
      {slotButton('aux')}
      <Button
        block
        label={() => `slot: empty ${p.customEmpty.value ? '🐚' : ''}`}
        onClick={() => Signal.toggle(p.customEmpty)}
      />
      <Button
        block
        label={() => `(reset)`}
        onClick={() => {
          Signal.walk(p.slots, (e) => e.mutate(undefined));
          p.customEmpty.value = undefined;
        }}
      />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
