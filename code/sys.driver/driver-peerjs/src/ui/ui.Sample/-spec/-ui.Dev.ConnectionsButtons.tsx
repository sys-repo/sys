import type { DebugSignals } from './-SPEC.Debug.tsx';

import { Button, css, P, Time, type t } from '../common.ts';
import { MaintainDyadButton } from './-ui.Dev.MaintainDyadButton.tsx';

type P = {
  debug: DebugSignals;
  style?: t.CssInput;
};

export function DevConnectionsButtons(props: P) {
  const { debug } = props;
  const { props: p, peer } = debug;
  const doc = p.doc.value;

  const elReset = (
    <Button
      block
      style={{ marginTop: 20 }}
      label={() => `(reset)`}
      onClick={() => {
        const doc = p.doc.value;
        doc?.change((d) => {
          delete d.connections;
          const ts = Time.now.timestamp;
          d.connections = { ts, group: [], dyads: [] };
        });
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
          const connections = P.ROOM.connections;
          connections.ts.ensure(d, Time.now.timestamp);
          connections.group.ensure(d, []);
          connections.dyads.ensure(d, []);
          const group = connections.group.get(d, []);
          if (!group.includes(peer.id)) group.push(peer.id);
        });
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
          const connections = P.ROOM.connections;
          const group = connections.group.get(d);
          if (!group) return;

          const i = group.findIndex((m) => m === peer.id);
          if (i !== -1) group.splice(i, 1);
        });
      }}
    />
  );

  const dyads = P.ROOM.connections.dyads.get(doc?.current, []);
  const elDyads = dyads.map((dyad, i) => <MaintainDyadButton key={i} dyad={dyad} debug={debug} />);

  return (
    <div className={css(props.style).class}>
      {elAddSelf}
      {elRemoveSelf}
      {elDyads}
      {elReset}
    </div>
  );
}
