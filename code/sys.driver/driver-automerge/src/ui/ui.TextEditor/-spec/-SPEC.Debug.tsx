import React from 'react';

import { Crdt } from '@sys/driver-automerge/browser';
import { Button, css, D, LocalStorage, ObjectView, Signal, Is } from '../common.ts';
import type * as t from './-t.ts';

type P = t.TextEditorProps;
type Storage = { theme?: t.CommonTheme; docId?: string };

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
  const localstore = LocalStorage.immutable<Storage>(`dev:${D.name}`, {});

  const repo = Crdt.repo({
    storage: 'IndexedDb',
    network: [
      // 'BroadcastChannel',
      { wss: Is.localhost() ? 'localhost:3030' : 'sync.automerge.org' },
    ],
  });

  const props = {
    debug: s(false),
    theme: s(localstore.current.theme),
    doc: s<t.CrdtRef<t.SampleTextDoc>>(),
  };
  const p = props;
  const api = {
    props,
    repo,
    localstore,
    listen() {
      p.debug.value;
      p.theme.value;
      p.doc.value;
    },
  };

  Signal.effect(() => {
    p.theme.value;
    localstore.change((d) => {
      d.theme = p.theme.value ?? 'Light';
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
  React.useEffect(() => void initDoc(debug), []);

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

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView
        name={'debug'}
        data={Signal.toObject(p)}
        expand={['$']}
        style={{ marginTop: 10 }}
      />
    </div>
  );
};

/**
 * Dev Helpers:
 */
export async function initDoc(debug: DebugSignals) {
  type T = t.SampleTextDoc;

  const { repo, localstore } = debug;
  const p = debug.props;

  const listen = (doc: t.CrdtRef<T>) => {
    doc.events().changed$.subscribe((e) => {
      console.info('⚡️ crdt:changed$', e);
    });
  };

  const id = localstore.current.docId;
  if (!id) {
    // Create:
    const doc = repo.create<T>({ text: '' });
    listen(doc);
    localstore.change((d) => (d.docId = doc.id));
    p.doc.value = doc;
  } else {
    // Retrieve:
    const doc = (await repo.get<T>(id))!;
    listen(doc);
    p.doc.value = doc;
  }
}
