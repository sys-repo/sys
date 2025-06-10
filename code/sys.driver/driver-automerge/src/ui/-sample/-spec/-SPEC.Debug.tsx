import { Crdt } from '@sys/driver-automerge/browser';
import React from 'react';

import { type t, Button, css, D, LocalStorage, ObjectView, Signal } from '../common.ts';

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
  const props = {
    debug: s(false),
    theme: s<t.CommonTheme>('Dark'),
    doc: s<P['doc']>(),
  };
  const p = props;
  const api = {
    props,
    repo: await Crdt.repo({ storage: 'IndexedDb', network: 'BroadcastChannel' }),
    localstore,
    listen() {
      p.debug.value;
      p.theme.value;
      p.doc.value;
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
  const repo = debug.repo;
  const p = debug.props;
  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Setup sample document:
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
      {sampleDocButtons(debug)}

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={[]} style={{ marginTop: 10 }} />
    </div>
  );
};

/**
 * Dev Helpers:
 */
export async function initDoc(debug: DebugSignals) {
  const { repo, localstore } = debug;
  const p = debug.props;

  const listen = (doc: t.CrdtRef<t.SampleDoc>) => {
    doc.events().changed$.subscribe((e) => {
      p.doc.value = e.after;
    });
  };

  const id = localstore.current.docId;
  if (!id) {
    // Create:
    const doc = repo.create<t.SampleDoc>({ cards: [], count: 0 });
    listen(doc);
    localstore.change((d) => (d.docId = doc.id));
    p.doc.value = doc.current;
  } else {
    // Retrieve:
    const doc = (await repo.get<t.SampleDoc>(id))!;
    listen(doc);
    p.doc.value = doc.current;
  }
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
