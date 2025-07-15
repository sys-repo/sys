import { Peer, type PeerOptions } from 'peerjs';
import React from 'react';

import {
  Button,
  Crdt,
  css,
  D,
  Is,
  LocalStorage,
  ObjectView,
  P,
  Signal,
  slug,
  Url,
  type t,
} from '../common.ts';
import { Conn } from '../u.ts';
import { DevConnectionsButtons } from './-ui.Dev.ConnectionsButtons.tsx';
import { ViewsList } from './-ui.ts';

type P = t.SampleProps;

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;
type Storage = Pick<P, 'theme'>;

/**
 * REF: https://peerjs.com
 */
export function createPeer() {
  const peerId = `webrtc-peer-${slug()}`;
  console.info(`connecting: ${peerId}...`);

  const peerOptions: PeerOptions = {
    host: 'webrtc.db.team',
    port: 443, //       ← Force HTTPS.
    secure: true, //    ← TLS (Transport Layer Security).
    debug: 2, //        ← 0 = silent, 1 = errors, 2 = warnings+errors, 3 = all.
  };

  const peer = new Peer(peerId, peerOptions);
  peer.on('open', (id) => console.info('⚡️ peer.on/open:', id));
  peer.on('error', (err) => console.error('⚡️ peer.on/error: 💥', err));

  return peer;
}

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;

  const peer = createPeer();
  console.info('🐚 peer:', peer);

  const defaults: Storage = { theme: 'Dark' };
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  /**
   * CRDT:
   */
  const qsSyncServer = Url.parse(location.href).toURL().searchParams.get('ws');
  const isLocalhost = location.hostname === 'localhost';
  const repo = Crdt.repo({
    storage: { database: 'dev:slc.crdt' },
    network: [
      //
      // { ws: 'sync.db.team' },
      // { ws: 'sync.automerge.org' },
      { ws: 'waiheke.sync.db.team' },
      isLocalhost && { ws: 'localhost:3030' },
      qsSyncServer && { ws: qsSyncServer },
    ],
  });

  const props = {
    redraw: s(0),
    theme: s(snap.theme),
    doc: s<t.Crdt.Ref<t.SampleDoc>>(),
    localStream: s<MediaStream>(),
    remoteStream: s<MediaStream>(),
    selectedStream: s<MediaStream>(),
  };
  const p = props;
  const redraw = () => p.redraw.value++;
  const api = {
    props,
    repo,
    peer,
    redraw,
    listen() {
      Object.values(props)
        .filter(Signal.Is.signal)
        .forEach((s) => s.value);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
    });
  });

  /**
   * Maintain CRDT document integrity:
   */
  let _events: t.Crdt.Events<t.SampleDoc> | undefined;
  Signal.effect(() => {
    _events?.dispose?.();

    const doc = p.doc.value;
    Conn.updateDyads(doc);

    const listen = () => {
      _events = doc?.events();
      _events?.$.subscribe((e) => {
        Conn.updateDyads(doc);
        p.redraw.value++;
      });
    };

    listen();
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
  const doc = p.doc.value;
  const repo = debug.repo;
  Signal.useRedrawEffect(() => debug.listen());
  Crdt.UI.useRedrawEffect(p.doc.value);

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <ViewsList
        style={{ marginLeft: 12, marginBottom: 25 }}
        enabled={!!doc}
        current={P.DEV.view.get(doc?.current)}
        onSelect={(e) => {
          doc?.change((d) => P.DEV.view.set(d, e.mode));
        }}
      />

      <hr />
      <div className={Styles.title.class}>{'Room'}</div>
      <DevConnectionsButtons debug={debug} style={{ marginBottom: 80 }} />

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Button
        block
        label={() => `create FileShare crdt`}
        onClick={() => {
          const target = repo.create({ count: 0 });
          doc?.change((d) => P.DEV.filesRef.set(d, target.id));
        }}
      />
      <Button
        block
        label={() => `delete FileShare crdt`}
        onClick={async () => {
          const id = P.DEV.filesRef.get(doc?.current, '');
          if (id) {
            await repo.delete(id);
            doc?.change((d) => P.DEV.filesRef.delete(d));
          }
        }}
      />

      <hr />
      <Button
        block
        label={() => `create Notes crdt`}
        onClick={() => {
          const target = repo.create({ count: 0 });
          doc?.change((d) => P.DEV.notesRef.set(d, target.id));
        }}
      />
      <Button
        block
        label={() => `delete Notes crdt`}
        onClick={async () => {
          const id = P.DEV.notesRef.get(doc?.current, '');
          if (id) {
            await repo.delete(id);
            doc?.change((d) => P.DEV.notesRef.delete(d));
          }
        }}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${P.DEV.mode.get(doc?.current, false)}`}
        onClick={() => {
          doc?.change((d) => {
            const current = P.DEV.mode.get(d, false);
            P.DEV.mode.set(d, !current);
          });
        }}
      />

      <Button block label={() => `redraw`} onClick={() => p.redraw.value++} />

      <Button
        block
        label={() => `increment ++`}
        onClick={(e) => {
          doc?.change((d) => (d.count = Is.number(d.count) ? d.count + 1 : 0));
        }}
      />

      <Button
        block
        label={() => `tmp 🐷`}
        onClick={() => {
          doc?.change((d) => {
            // const obj = Obj.Path.get<any>(d, [''], {});
            // const p = Obj.Path.curry(['count']);
            // p.delete(d);
          });
        }}
      />

      <ObjectView
        name={'debug(room)'}
        data={Signal.toObject({ ...p, doc: p.doc.value?.current })}
        expand={0}
        style={{ marginTop: 10 }}
      />
    </div>
  );
};
