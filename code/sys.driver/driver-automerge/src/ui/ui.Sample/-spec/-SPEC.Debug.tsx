import React from 'react';

import { Crdt } from '@sys/driver-automerge/browser';
import { Color, Button, css, D, Input, Is, LocalStorage, ObjectView, Signal } from '../common.ts';
import type * as t from './-t.ts';

type P = t.SampleProps;
type LocalStore = { docId?: string; syncServerUrl?: string; syncServerEnabled?: boolean };

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
    doc: s<t.CrdtRef<t.SampleDoc>>(),
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
    const wss = Is.localhost() ? 'localhost:3030' : 'sync.db.team';
    localstore.change((d) => {
      d.docId = p.docId.value;
      d.syncServerUrl = p.syncServerUrl.value ?? wss;
      d.syncServerEnabled = p.syncServerEnabled.value ?? true;
    });
  });

  Signal.effect(() => {
    const wss = p.syncServerUrl.value;
    const isWebsockets = p.syncServerEnabled.value;

    const network: t.CrdtBrowserNetworkArg[] = [];
    if (wss && isWebsockets) network.push({ wss });

    p.doc.value = undefined;
    p.repo.value = Crdt.repo({
      storage: true, // ← 'IndexedDb',
      network,
    });
  });

  // Listen to current document → redraw.
  let events: t.CrdtEvents<t.SampleDoc> | undefined;
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
      {editSampleDocButtons(debug)}

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView
        name={'debug'}
        data={{ ...Signal.toObject(p), doc: p.doc?.value?.current }}
        style={{ marginTop: 10 }}
        expand={0}
      />
    </div>
  );
};

/**
 * Dev Helpers:
 */
export function editSampleDocButtons(debug: DebugSignals) {
  const { props: p, localstore } = debug;

  const increment = async (by: number) => {
    const repo = p.repo.value;
    const docId = localstore.current.docId;
    if (!docId || !repo) return;

    const doc = (await repo.get<t.SampleDoc>(docId))!;
    doc.change((d) => (d.count += by));
  };

  return (
    <React.Fragment>
      <Button block label={() => `increment`} onClick={() => increment(1)} />
      <Button block label={() => `decrement`} onClick={() => increment(-1)} />
    </React.Fragment>
  );
}
