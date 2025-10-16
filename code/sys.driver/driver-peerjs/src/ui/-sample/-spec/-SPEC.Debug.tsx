import React from 'react';
import {
  Button,
  Crdt,
  css,
  D,
  Is,
  Kbd,
  LocalStorage,
  Obj,
  ObjectView,
  P,
  Peer,
  Rx,
  Signal,
  useDist,
  type t,
} from '../common.ts';
import { createPeer } from './-u.createPeer.ts';
import { createRepo } from './-u.createRepo.ts';
import { ding } from './-u.ding.ts';
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
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;

  const defaults: Storage = { theme: 'Dark' };
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const repo = createRepo();
  const peer = createPeer();
  console.info('🐚 peer:', peer);

  const props = {
    redraw: s(0),
    theme: s(snap.theme),
    doc: s<t.Crdt.Ref<t.SampleDoc>>(),
    localStream: s<MediaStream>(),
    remoteStream: s<MediaStream>(),
    selectedStream: s<MediaStream>(),
    selectedPath: s<t.ObjectPath>([]),
  };
  const p = props;
  const api = {
    props,
    repo,
    peer,
    redraw,
    listen,
  };

  function redraw() {
    p.redraw.value++;
  }
  function listen() {
    Signal.listen(props);
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
    });
  });

  /**
   * Monitor document:
   */
  let _events: t.Crdt.Events<t.SampleDoc> | undefined;
  Signal.effect(() => {
    const doc = p.doc.value;
    const updateDyads = () => Peer.Conn.updateDyads(P.ROOM.connections.dyads.path, doc);
    updateDyads(); // Immediate: run on load.

    _events?.dispose?.();
    _events = doc?.events();
    const $ = _events?.$;
    if (!$) return;

    type T = t.WebRtc.PeerId[];
    $.subscribe(() => updateDyads());
    $.pipe(
      Rx.map(() => Obj.Path.get<T>(doc?.current, P.ROOM.connections.group.path, [])),
      Rx.distinctWhile((a, b) => a.join() === b.join()),
      Rx.debounceTime(500),
    ).subscribe((e) => ding());
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

  /**
   * Hooks:
   */
  const dist = useDist();
  const notes = Crdt.UI.useDoc(debug.repo, P.DEV.notesRef.get(doc?.current));
  Signal.useRedrawEffect(() => debug.listen());
  Crdt.UI.useRev(p.doc.value);
  Crdt.UI.useRev(notes.doc);

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
          doc?.change((d) => {
            P.DEV.filesRef.set(d, target.id);
            P.DEV.view.set(d, 'FileShare');
          });
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
        enabled={() => !P.DEV.notesRef.exists(doc?.current)}
        label={() => `create Notes crdt`}
        onClick={() => {
          const target = repo.create({ count: 0 });
          doc?.change((d) => P.DEV.notesRef.set(d, target.id));
        }}
      />
      <Button
        block
        enabled={false}
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
          doc?.change((d) => {
            const next = Is.number(d.count) ? d.count + 1 : 0;
            d.count = Kbd.Is.command(e) ? 0 : next;
          });
        }}
      />

      <Button
        block
        label={() => `tmp 🐷`}
        onClick={() => {
          doc?.change((d) => {
            P.ROOM.connections['-root'].delete(d);
          });
        }}
      />

      <ObjectView
        name={'debug(room)'}
        data={{
          ...Signal.toObject(p),
          doc: doc?.current,
          'pkg.version': dist.toString(),
        }}
        expand={0}
        style={{ marginTop: 25 }}
      />

      <ObjectView
        name={'notes'}
        data={{
          'doc.id': notes.doc?.id,
          doc: Obj.trimStringsDeep(notes.doc?.current ?? {}, 25),
        }}
        expand={2}
        style={{ marginTop: 5 }}
      />
    </div>
  );
};
