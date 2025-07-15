import type { DebugSignals } from './-SPEC.Debug.tsx';

import { type t, Button, Media, P } from '../common.ts';
import { Conn } from '../u.ts';

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

  return (
    <Button
      tooltip={`${dyad[0]} .. ${dyad[1]}`}
      block
      label={() => `🐚 ƒ: maintainDyadConnection( 🐷 .. 🐷 )`}
      onClick={() => {
        const doc = p.doc.value;
        if (!doc) return;

        const peer = debug.peer;
        const localStream = p.localStream.value;

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
}
