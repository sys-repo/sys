import React from 'react';

import { Crdt } from '@sys/driver-automerge/browser';
import { Button, css, D, Is, LocalStorage, ObjectView, Signal } from '../common.ts';
import type * as t from './-t.ts';

type P = t.SampleProps;
type LocalStore = { docId?: string };

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

  // const wss = Is.localhost() ? 'localhost:3030' : 'sync.db.team';
  // const wss = 'wss://sync.automerge.org'; // ← ref: https://automerge.org/docs/tutorial/local-sync
  const wss = 'sync.db.team';
  console.info(`wss: ${wss}`);

  const repo = Crdt.repo({
    storage: 'IndexedDb',
    network: [
      // 'BroadcastChannel',
      { wss },
    ],
  });

  const props = {
    debug: s(false),
    theme: s<t.CommonTheme>('Dark'),
    count: s(0),
    doc: s<P['doc']>(),
  };

  const p = props;
  const api = {
    props,
    repo,
    localstore,
    wss,
    listen() {
      p.debug.value;
      p.theme.value;
      p.doc.value;
      p.count.value;
    },
  };

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
  React.useEffect(() => void initDoc(debug), []);

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>
        <div>{`${D.name}: CRDT`}</div>
        <div>{'IndexedDB'}</div>
      </div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <div>{debug.wss}</div>
      {sampleDocButtons(debug)}

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView
        name={'debug'}
        data={{ ...Signal.toObject(p), doc: p.doc?.value?.current }}
        expand={1}
        style={{ marginTop: 10 }}
      />
    </div>
  );
};

/**
 * Dev Helpers:
 */
export async function initDoc(debug: DebugSignals) {
  type T = t.SampleDoc;
  const { repo, localstore } = debug;
  const p = debug.props;
  const key = 'doc';

  const listen = (doc: t.CrdtRef<T>) => {
    doc.events().changed$.subscribe((e) => {
      console.info('⚡️ crdt:changed$', e);
      p.count.value += 1;
    });
  };

  const remember = (doc: t.CrdtRef<T>) => {
    p.doc.value = doc;
    localstore.change((d) => (d.docId = doc.id));
    addQueryParam(key, doc.id);
  };

  const setup = async (id?: string) => {
    console.log('id', id);
    if (!id) {
      // Create:
      const doc = repo.create<T>({ count: 0 });
      listen(doc);
      remember(doc);

    } else {
      // Retrieve:
      const doc = (await repo.get<T>(id))!;
      console.log('doc', doc);
      listen(doc);
      remember(doc);
    }
  };

  const id = getQueryParam(key) ?? localstore.current.docId;
  await setup(id);
}

export function sampleDocButtons(debug: DebugSignals) {
  const { repo, localstore } = debug;

  const increment = async (by: number) => {
    const id = localstore.current.docId;
    if (!id) return;
    const doc = (await repo.get<t.SampleDoc>(id))!;
    doc.change((d) => (d.count += by));
  };

  return (
    <React.Fragment>
      <Button block label={() => `increment`} onClick={() => increment(1)} />
      <Button block label={() => `decrement`} onClick={() => increment(-1)} />
    </React.Fragment>
  );
}

// type AddQueryParam = (key: string, value: string) => void;

const addQueryParam = (key: string, value: string) => {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  window.history.replaceState(null, '', url.toString());
};

const getQueryParam = (key: string) => {
  const url = new URL(window.location.href);
  return url.searchParams.get(key) ?? undefined;
};
