import React from 'react';
import { type t, Color, css, Switch } from './common.ts';

export type SyncServerProps = {
  endpoint?: t.StringUrl;
  enabled?: boolean;
  peerId?: t.StringId;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onSyncEnabledChange?: (e: { next: boolean }) => void;
};

type P = SyncServerProps;

/**
 * Component:
 */
export const SyncServer: React.FC<P> = (props) => {
  const { peerId, enabled = false } = props;
  const address = wrangle.address(props);
  const peerParts = (peerId ?? '').split('.');

  /**
   * Handlers:
   */
  const toggleEnabled = () => props.onSyncEnabledChange?.({ next: !enabled });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      placeItems: 'center',
      userSelect: 'none',
    }),
    body: css({
      display: 'grid',
      gridAutoFlow: 'column',
      gridAutoColumns: 'auto',
      columnGap: 6,
      placeItems: 'center',
    }),
    peer: css({ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'auto' }),
    label: css({ opacity: 0.5 }),
    address: css({ opacity: enabled ? 1 : 0.2, transition: 'opacity 120ms ease' }),
  };

  const elPeer = peerId && enabled && (
    <React.Fragment>
      <span className={styles.label.class}>{'•'}</span>
      <div className={styles.peer.class}>
        <span className={styles.label.class}>{`client.${peerParts.slice(0, -1)}.`}</span>
        <span>{peerParts.slice(-1)}</span>
      </div>
    </React.Fragment>
  );

  return (
    <div className={css(styles.base, props.style).class} onMouseDown={toggleEnabled}>
      <div className={styles.body.class}>
        <Switch
          value={enabled}
          theme={theme.name}
          height={16}
          style={{ top: 1 }}
          onMouseDown={(e) => {
            e.stopPropagation();
            toggleEnabled();
          }}
        />
        <span className={styles.label.class}>{'sync-server:'}</span>
        <span className={styles.address.class}>{address}</span>
        {elPeer}
      </div>
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  address(props: P) {
    if (props.endpoint == null) return '<unknown>';
    const txt = props.endpoint.trim().replace(/^wss?:\/\//, ''); // removes 'ws://' or 'wss://'.
    const isLocal = txt.startsWith('localhost');
    const protocol = isLocal ? 'ws' : 'wss';
    return `${protocol}://${txt}`;
  },
} as const;
