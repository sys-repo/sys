import React from 'react';

import { Crdt } from '@sys/driver-automerge/browser';
import { Button, css, D, Is, LocalStorage, ObjectView, Signal } from '../common.ts';
import type * as t from './-t.ts';

type P = t.TextEditorProps;
type Storage = { theme?: t.CommonTheme; docId?: string; debug?: boolean } & Pick<
  P,
  'autoFocus' | 'readOnly' | 'scroll'
>;

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

  const defaults: Storage = {
    debug: false,
    theme: 'Dark',
    autoFocus: true,
    readOnly: D.readOnly,
    scroll: D.scroll,
  };
  const store = LocalStorage.immutable<Storage>(`dev:${D.name}`, defaults);
  const snap = store.current;

  const repo = Crdt.repo({
    storage: { database: 'dev.crdt' },
    network: [
      // 'BroadcastChannel',
      { ws: 'sync.db.team' },
    ],
  });

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    autoFocus: s<P['autoFocus']>(snap.autoFocus),
    readOnly: s<P['readOnly']>(snap.readOnly),
    scroll: s<P['scroll']>(snap.scroll),
    doc: s<t.CrdtRef<t.SampleTextDoc>>(),
  };
  const p = props;
  const api = {
    props,
    repo,
    localstore: store,
    listen() {
      Object.values(p)
        .filter(Signal.Is.signal)
        .forEach((s) => s.value);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.debug = p.debug.value;
      d.theme = p.theme.value;
      d.autoFocus = p.autoFocus.value;
      d.readOnly = p.readOnly.value;
      d.scroll = p.scroll.value;
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
      <Button
        block
        label={() => `readOnly: ${p.readOnly.value ?? `<undefined> (default: ${D.readOnly})`}`}
        onClick={() => Signal.toggle(p.readOnly)}
      />
      <Button
        block
        label={() => `scroll: ${p.scroll.value ?? `<undefined> (default: ${D.scroll})`}`}
        onClick={() => Signal.toggle(p.scroll)}
      />
      <Button
        block
        label={() => `autoFocus: ${p.autoFocus.value ?? `<undefined> (default: ${D.autoFocus})`}`}
        onClick={() => Signal.toggle(p.autoFocus)}
      />
      <Button
        block
        label={() => `autoFocus: (increment number)`}
        onClick={() => {
          if (Is.bool(p.autoFocus.value)) p.autoFocus.value = -1;
          (p.autoFocus.value as number) += 1;
        }}
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
    doc.events().$.subscribe((e) => {
      console.info('⚡️ crdt:$ (changed)', e);
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
