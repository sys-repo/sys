import type { DebugSignals } from './-SPEC.Debug.tsx';

import { Button, css, Is, Media, Time, type t } from '../common.ts';
import { Conn } from '../u.ts';

export function DevConnectionsButtons(props: { debug: DebugSignals; style?: t.CssInput }) {
  const { debug } = props;
  const { props: p, peer } = debug;

  const elReset = (
    <Button
      block
      label={() => `reset`}
      onClick={() => {
        const doc = p.doc.value;
        doc?.change((d) => {
          delete d.connections;
          const ts = Time.now.timestamp;
          d.connections = { ts, group: [], dyads: [] };
        });
        console.info('after clear', { ...doc?.current });
      }}
    />
  );

  const elAddSelf = (
    <Button
      block
      label={() => `→ add self`}
      onClick={() => {
        const doc = p.doc.value;
        if (!doc) return;

        doc.change((d) => {
          const ts = Time.now.timestamp;
          if (!Is.object(d.connections)) d.connections = { ts, group: [], dyads: [] };
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
      label={() => `← remove self`}
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
      label={() => `🐚 ƒ: maintainDyadConnection( 🐷 .. 🐷 )`}
      onClick={() => {
        const doc = p.doc.value;
        if (!doc) return;

        const peer = debug.peer;
        const localStream = p.localStream.value;
        const dyads = doc.current.connections?.dyads ?? [];
        const dyad = dyads[0]; // 🐷 NB: hack, first dyad used only.

        console.log('dyad', dyad);
        console.log('localStream', localStream);

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
    <div className={css(props.style).class}>
      {elAddSelf}
      {/* {elRemoveSelf} */}
      {elTmp}
      {elReset}
    </div>
  );
}
