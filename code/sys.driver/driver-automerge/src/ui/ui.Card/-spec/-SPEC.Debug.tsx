import React from 'react';

import { Crdt } from '@sys/driver-automerge/browser';
import { type t, Button, Color, css, D, LocalStorage, ObjectView, Signal } from '../common.ts';

type P = t.CardProps;
type Storage = Pick<P, 'theme' | 'debug'> & {
  docId?: string;
  syncUrl?: string;
  syncEnabled?: boolean;
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = Awaited<ReturnType<typeof createDebugSignals>>;
export type TDoc = {
  count: number;
  text?: string;
};

/**
 * Signals:
 */
export async function createDebugSignals() {
  const s = Signal.create;

  const defaults: Storage = {
    debug: false,
    theme: 'Dark',
    syncUrl: 'sync.db.team',
    syncEnabled: true,
  };
  const store = LocalStorage.immutable<Storage>(`dev:${D.name}`, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    redraw: s(0),

    repo: s<t.CrdtRepo>(),
    syncUrl: s(snap.syncUrl),
    syncEnabled: s(snap.syncEnabled),

    docId: s(store.current.docId),
    doc: s<t.CrdtRef<TDoc>>(),
  };

  const p = props;
  const api = {
    props,
    localstore: store,
    listen() {
      Object.values(p)
        .filter(Signal.Is.signal)
        .forEach((s) => s.value);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.docId = p.docId.value;
      d.syncUrl = p.syncUrl.value;
      d.syncEnabled = p.syncEnabled.value;
    });
  });

  Signal.effect(() => {
    const ws = p.syncUrl.value;
    const isWebsockets = p.syncEnabled.value;

    const network: t.CrdtBrowserNetworkArg[] = [];
    if (ws && isWebsockets) network.push({ ws });

    const repo = Crdt.repo({
      storage: { database: 'dev.crdt' }, // ← 'IndexedDb' or (true).
      network,
    });

    console.info(`🧫 repo:`, repo);
    if (isWebsockets) console.info('└─', `(websockets) → endpoint: ${ws}`);

    p.repo.value = repo;
    p.doc.value = undefined;
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
  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const theme = Color.theme();
  const styles = { base: css({}) };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      {valueEditorButtons(debug)}

      <hr />
      <Button block label={() => `redraw`} onClick={() => p.redraw.value++} />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => {
          const v = p.syncUrl.value;
          return `sync-server: ${v ? `"${v}"` : ''}`;
        }}
        onClick={() => {
          Signal.cycle(p.syncUrl, ['localhost:3030', 'sync.db.team', 'sync.automerge.org']);
        }}
      />

      <ObjectView
        //
        name={'debug'}
        data={wrangle.data(debug)}
        style={{ marginTop: 10 }}
        expand={0}
      />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  data(debug: DebugSignals) {
    const p = debug.props;
    const doc = p.doc.value;
    return Signal.toObject({ ...p, doc: doc?.current });
  },
} as const;

/**
 * Dev Helpers:
 */
export function valueEditorButtons(debug: DebugSignals) {
  const { props: p, localstore } = debug;

  const increment = async (by: number) => {
    const repo = p.repo.value;
    const docId = localstore.current.docId;
    if (!docId || !repo) return;

    const doc = (await repo.get<TDoc>(docId))!;
    doc.change((d) => (d.count += by));
  };

  return (
    <React.Fragment>
      <Button block label={() => `increment`} onClick={() => increment(1)} />
      <Button block label={() => `decrement`} onClick={() => increment(-1)} />
      <Button
        block
        label={() => {
          const doc = p.doc.value;
          const current = doc?.current.text;
          return current ? `text: 👋 (← remove)` : `text: 👋`;
        }}
        onClick={() => {
          const doc = p.doc.value;
          const current = doc?.current.text;
          const next = !!current ? '' : '👋';
          doc?.change((d) => (d.text = next));
        }}
      />
    </React.Fragment>
  );
}
