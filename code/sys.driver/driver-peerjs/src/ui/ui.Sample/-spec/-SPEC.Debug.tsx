import React from 'react';
import { type t, slug, Button, css, D, LocalStorage, ObjectView, Signal } from '../common.ts';
import { Peer, type PeerOptions } from 'peerjs';

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
  const peerId = `peer-${slug()}`;
  console.info(`connecting: ${peerId}...`);

  const peerOptions: PeerOptions = {
    host: 'rtc.db.team',
    port: 443, //          Force HTTPS port.
    secure: true, //       TLS (Transport Layer Security).
    debug: 2, //           (optional): 0 = silent, 1 = errors, 2 = warnings+errors, 3 = all.
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

  const defaults: Storage = { theme: 'Dark', debug: false };
  const store = LocalStorage.immutable<Storage>(`dev:${D.name}`, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
  };
  const p = props;
  const api = {
    props,
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
