import React from 'react';
import { type t, Color, Crdt, css, pkg } from './common.ts';

export const CanvasCell: React.FC<t.CanvasCellProps> = (props) => {
  const { debug = false } = props;

  /**
   * Hooks:
   */
  const ws = 'sync.db.team';
  const crdt = Crdt.UI.Repo.useRepo({
    factory(e) {
      return Crdt.repo({
        storage: { database: 'dev.slc.crdt' },
        network: ['BroadcastChannel', { ws }],
      });
    },
  });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Crdt.UI.Card
        theme={theme.name}
        syncUrl={ws}
        headerStyle={{ topOffset: -30 }}
        localstorageKey={`${pkg.name}.splash`}
        signals={crdt.signals}
      />
    </div>
  );
};
