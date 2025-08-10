import React from 'react';

import { type t, Button, Media, P, Peer, css } from '../common.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

type P = {
  dyad: t.WebRtc.PeerDyad;
  debug: DebugSignals;
};

/**
 * Component: activate Dyad connection.
 */
export function MaintainDyadButton(props: P) {
  const { dyad, debug } = props;
  const p = debug.props;

  /**
   * Hooks:
   */
  const [controller, setController] = React.useState<t.DyadConnection>();

  /**
   * Render:
   */
  const peerCss = (isConnected: boolean = false) => {
    return css({
      opacity: isConnected ? 1 : 0.5,
      filter: isConnected ? 'none' : 'grayscale(100%)',
      transition: 'opacity 120ms ease, filter 120ms ease',
    });
  };
  const styles = {
    label: css({
      position: 'relative',
      display: 'grid',
      gridAutoFlow: 'column',
      gridAutoColumns: 'auto',
      justifyContent: 'start',
      columnGap: 6,
    }),
    peerLeft: peerCss(controller?.connected.local),
    peerRight: peerCss(controller?.connected.remote),
  };

  const elLabel = (
    <div className={styles.label.class}>
      <span>{'🐚 ƒ: maintainDyadConnection('}</span>
      <span className={styles.peerLeft.class}>{'🐷'}</span>
      <span>{'..'}</span>
      <span className={styles.peerRight.class}>{'🐷'}</span>
      <span>{')'}</span>
    </div>
  );

  return (
    <Button
      tooltip={`${dyad[0]} .. ${dyad[1]}`}
      block
      label={() => elLabel}
      onClick={() => {
        const doc = p.doc.value;
        if (!doc) return;

        const peer = debug.peer;
        const localStream = p.localStream.value;
        if (!(dyad && peer && localStream)) return;

        if (!!controller) return; // Already instantiated.

        const ctrl = Peer.Conn.maintainDyadConnection({
          peer,
          dyad,
          localStream,
          onRemoteStream(e) {
            console.info('⚡️ onRemoteStream', e);
            Media.Log.tracks(`- remote (${e.remote.peer}):`, e.remote.stream);
            p.remoteStream.value = e.remote.stream;
          },
        });

        setController(ctrl);

        console.group(`🌳 maintainDyadConnection/args:`);
        console.log('peer:', peer);
        console.log('dyad:', [...dyad]);
        console.log('localStream:', localStream);
        console.log('controller:', ctrl);
        console.groupEnd();
      }}
    />
  );
}
