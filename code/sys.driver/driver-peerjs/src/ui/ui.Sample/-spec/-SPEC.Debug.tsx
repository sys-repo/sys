import { Peer, type PeerOptions } from 'peerjs';
import React from 'react';
import {
  Button,
  Crdt,
  css,
  D,
  Is,
  LocalStorage,
  Media,
  ObjectView,
  Signal,
  slug,
  type t,
} from '../common.ts';
import { Conn } from '../u.ts';

type P = t.SampleProps;

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;
type Storage = Pick<P, 'theme' | 'debug'>;

/**
 * REF: https://peerjs.com/
 */
export function createPeer() {
  const peerId = `webrtc-peer-${slug()}`;
  console.info(`connecting: ${peerId}...`);

  const peerOptions: PeerOptions = {
    host: 'rtc.db.team',
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

  const defaults: Storage = {
    theme: 'Dark',
    debug: true,
  };
  const store = LocalStorage.immutable<Storage>(`dev:${D.name}`, defaults);
  const snap = store.current;

  /**
   * CRDT:
   */
  const repo = Crdt.repo({
    storage: { database: 'dev:slc.crdt' },
    network: [{ ws: 'sync.db.team' }],
  });

  const props = {
    redraw: s(0),
    debug: s(snap.debug),
    theme: s(snap.theme),
    doc: s<t.CrdtRef<t.SampleDoc>>(),
    localStream: s<MediaStream>(),
    remoteStream: s<MediaStream>(),
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
      d.debug = p.debug.value;
    });
  });

  /**
   * Maintain CRDT document integrity:
   */
  let _events: t.CrdtEvents<t.SampleDoc> | undefined;
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
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />

      <Button
        block
        label={() => `count: increment`}
        onClick={() => {
          const doc = p.doc.value;
          doc?.change((d) => d.count++);
        }}
      />

      <hr />
      <DevConnectionsButtons debug={debug} />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />

      <Button block label={() => `redraw`} onClick={() => p.redraw.value++} />
      <ObjectView
        name={'debug'}
        data={Signal.toObject({ ...p, doc: p.doc.value?.current })}
        expand={0}
        style={{ marginTop: 10 }}
      />
    </div>
  );
};

/**
 * Dev Helpers:
 */
export function DevConnectionsButtons(props: { debug: DebugSignals }) {
  const { debug } = props;
  const { props: p, peer } = debug;

  const elClear = (
    <Button
      block
      label={() => `clear`}
      onClick={() => {
        const doc = p.doc.value;
        doc?.change((d) => {
          delete d.connections;
          d.connections = { group: [], dyads: [] };
        });
        console.info('after clear', { ...doc?.current });
      }}
    />
  );

  const elAddSelf = (
    <Button
      block
      label={() => `- group: add self`}
      onClick={() => {
        const doc = p.doc.value;
        if (!doc) return;

        doc.change((d) => {
          if (!Is.object(d.connections)) d.connections = { group: [], dyads: [] };
          const group = d.connections.group;
          if (!group.includes(peer.id)) group.push(peer.id);
        });

        console.info('after change:', { ...doc.current });
      }}
    />
  );

  const elRemoveSelf = (
    <Button
      block
      label={() => `- group: remove self`}
      onClick={() => {
        const doc = p.doc.value;
        if (!doc) return;

        doc.change((d) => {
          const group = d.connections?.group;
          if (!group) return;

          const i = group.findIndex((m) => m === peer.id);
          if (i !== -1) group.splice(i, 1);
        });

        console.info('after change:', { ...doc.current });
      }}
    />
  );

  const elTmp = (
    <Button
      block
      label={() => `🐷 ƒ: maintainDyadConnection( 🌳..🌳 )`}
      onClick={() => {
        const doc = p.doc.value;
        if (!doc) return;

        const peer = debug.peer;
        const localStream = p.localStream.value;
        const dyads = doc.current.connections?.dyads ?? [];
        const dyad = dyads[0];

        if (!dyad || !localStream) return;

        const res = Conn.maintainDyadConnection({
          peer,
          dyad,
          localStream,
          onRemoteStream(e) {
            console.info('⚡️ onRemoteStream', e);
            Media.Log.tracks(`- remote (${e.remote.peer}):`, e.remote.stream);
            p.remoteStream.value = e.remote.stream;
          },
        });

        console.group(`🌳 maintainDyadConnection/args:`);
        console.log('peer:', peer);
        console.log('dyad:', [...dyad]);
        console.log('localStream:', localStream);
        console.log('res:', res);
        console.groupEnd();
      }}
    />
  );

  return (
    <>
      {elClear}
      {elAddSelf}
      {elRemoveSelf}
      {elTmp}
    </>
  );
}
