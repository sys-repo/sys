import { Peer, type PeerOptions } from 'peerjs';
import React from 'react';
import {
  Button,
  Crdt,
  css,
  D,
  Is,
  LocalStorage,
  Obj,
  ObjectView,
  Signal,
  slug,
  type t,
} from '../common.ts';

type P = t.SampleProps;

type TDoc = {
  count: number;
  connections?: {
    group: t.StringId[];
    dyads: [t.StringId, t.StringId][];
  };
};

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

  peer.on('open', (id) => {
    console.info('⚡️ peer.on:open:', id);
  });

  peer.on('error', (err) => {
    console.error('⚡️ peer.on:error: 💥', err);
  });

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
    network: ['BroadcastChannel', { ws: 'sync.db.team' }],
  });

  const props = {
    redraw: s(0),
    debug: s(snap.debug),
    theme: s(snap.theme),
    doc: s<t.CrdtRef<TDoc>>(),
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

  // ---------------------------------------------------

  /**
   * Return every unique, unordered pair (dyad)
   * from the given peer-id list.
   */
  type Dyad = [t.StringId, t.StringId];
  function toDyads(peers: t.StringId[]): Dyad[] {
    const ids = [...new Set(peers)]; // ensure uniqueness.
    const res = ids.flatMap((a, i) => ids.slice(i + 1).map((b): Dyad => [a, b]));
    return res.map((item) => item.toSorted()) as Dyad[];
  }

  /**
   * Sync Dyads:
   */
  function updateDyads(doc?: t.CrdtRef<TDoc>) {
    const connections = doc?.current.connections;
    if (!connections) return false;

    const group = connections?.group ?? [];
    const current = [...(connections?.dyads ?? [])];
    const next = toDyads(group);
    const diff = !Obj.eql(current, next);

    if (diff) {
      doc?.change((d) => {
        Obj.Path.Mutate.ensure(d, ['connections', 'dyads'], []);
        d.connections!.dyads = next;
      });
    }

    return diff;
  }

  let _events: t.CrdtEvents<TDoc> | undefined;
  Signal.effect(() => {
    _events?.dispose?.();

    const doc = p.doc.value;
    updateDyads(doc);

    const listen = () => {
      _events = doc?.events();
      _events?.$.subscribe((e) => {
        updateDyads(doc);
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
      {/* <div className={Styles.title.class}>{D.name}</div> */}

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />

      <Button
        block
        label={() => `doc: increment`}
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

  const elAddSelf = (
    <Button
      block
      label={() => `group: add self`}
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
      label={() => `group: remove self`}
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

  return (
    <>
      {elAddSelf}
      {elRemoveSelf}
      {elClear}
    </>
  );
}
