import React from 'react';

import { Crdt } from '@sys/driver-automerge/browser';
import { Button, Color, css, D, LocalStorage, ObjectView, Signal } from '../common.ts';
import type * as t from './-t.ts';

type P = t.CardProps;
type LocalStore = {
  docId?: string;
  syncServerUrl?: string;
  syncServerEnabled?: boolean;
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
  const localstore = LocalStorage.immutable<LocalStore>(`${D.name}`, {});

  const props = {
    debug: s(false),
    theme: s<t.CommonTheme>('Dark'),
    redraw: s(0),

    repo: s<t.CrdtRepo>(),
    syncServerUrl: s(localstore.current.syncServerUrl),
    syncServerEnabled: s(localstore.current.syncServerEnabled),

    docId: s(localstore.current.docId),
    doc: s<t.CrdtRef<t.TDoc>>(),
  };

  const p = props;
  const api = {
    props,
    localstore,
    listen() {
      p.redraw.value;
      p.debug.value;
      p.theme.value;
      p.redraw.value;
      p.docId.value;
      p.doc.value;
      p.repo.value;
      p.syncServerUrl.value;
      p.syncServerEnabled.value;
    },
  };

  Signal.effect(() => {
    const ws = p.syncServerUrl.value;

    localstore.change((d) => {
      d.docId = p.docId.value;
      d.syncServerUrl = p.syncServerUrl.value ?? ws;
      d.syncServerEnabled = p.syncServerEnabled.value ?? true;
    });
  });

  Signal.effect(() => {
    const ws = p.syncServerUrl.value;
    const isWebsockets = p.syncServerEnabled.value;

    const network: t.CrdtBrowserNetworkArg[] = [];
    if (ws && isWebsockets) network.push({ ws });

    const repo = Crdt.repo({
      storage: 'IndexedDb', // ← 'IndexedDb' or (true).
      network,
    });

    console.info(`🧫 repo:`, repo);
    console.info('└─', `(websockets) → endpoint: ${ws}`);

    p.doc.value = undefined;
    p.repo.value = repo;
  });

  // Listen to current document → (redraw).
  let events: t.CrdtEvents<t.TDoc> | undefined;
  Signal.effect(() => {
    events?.dispose();
    events = p.doc.value?.events();
    events?.changed$.subscribe((e) => p.redraw.value++);
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
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />

      <Button
        block
        label={() => {
          const v = p.syncServerUrl.value;
          return `sync-server (endpoint): ${v}`;
        }}
        onClick={() => {
          const current = p.syncServerUrl.value;
          const next = current === 'sync.db.team' ? 'localhost:3030' : 'sync.db.team';
          p.syncServerUrl.value = next;
        }}
      />
      <ObjectView
        name={'debug'}
        data={{
          ...Signal.toObject(p),
          doc: p.doc?.value?.current,
        }}
        style={{ marginTop: 10 }}
        expand={0}
      />
    </div>
  );
};

/**
 * Dev Helpers:
 */
export function valueEditorButtons(debug: DebugSignals) {
  const { props: p, localstore } = debug;

  const increment = async (by: number) => {
    const repo = p.repo.value;
    const docId = localstore.current.docId;
    if (!docId || !repo) return;

    const doc = (await repo.get<t.TDoc>(docId))!;
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
