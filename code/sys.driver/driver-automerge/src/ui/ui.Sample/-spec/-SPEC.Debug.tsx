import React from 'react';

import { Crdt } from '@sys/driver-automerge/browser';
import { Button, css, D, Is, LocalStorage, ObjectView, Signal } from '../common.ts';
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
    doc: s<P['doc']>(),
  };

  const p = props;
  const api = {
    props,
    localstore,
    listen() {
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

    p.repo.value = Crdt.repo({
      storage: true, // ← 'IndexedDb',
      network,
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
  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Setup sample CRDT document:
   */
  type D = t.SampleDoc;
  const listen = (doc?: t.CrdtRef<D>) => {
    if (!doc) return;
    doc.events().changed$.subscribe((e) => {
      console.info('⚡️ crdt:changed$', e);
      p.redraw.value += 1;
    });
  };

  const loadDoc = async (id?: string) => {
    if (!Crdt.Is.id(id)) {
      p.doc.value = undefined;
      return;
    }

    const repo = p.repo.value;
    const doc = await repo?.get<D>(id);
    p.doc.value = doc;
    listen(doc);
  };

  Signal.useEffect(() => {
    const docId = p.docId.value;
    loadDoc(docId);
  });

  /**
   * Render:
   */
  const styles = { base: css({}) };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>
        <div>{`Sample`}</div>
        <div>{'CRDT / IndexedDB'}</div>
      </div>

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
