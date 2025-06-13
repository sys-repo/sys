import React from 'react';
import { type t, Switch, Color, css } from './common.ts';

export type SyncServerProps = {
  endpoint?: t.StringUrl;
  peerId?: t.StringId;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

type P = SyncServerProps;

/**
 * Component:
 */
export const SyncServer: React.FC<P> = (props) => {
  const { peerId } = props;
  const address = wrangle.address(props);

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
    }),
    body: css({
      display: 'grid',
      gridAutoFlow: 'column',
      gridAutoColumns: 'auto',
      columnGap: 6,
      placeItems: 'center',
    }),
    label: css({ opacity: 0.5, userSelect: 'none' }),
  };

  const elPeer = peerId && (
    <React.Fragment>
      <span className={styles.label.class}>{'•'}</span>
      <span className={styles.label.class}>{peerId}</span>
    </React.Fragment>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <span className={styles.label.class}>{'sync-server:'}</span>
        <span>{address}</span>
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
    const isLocal = txt.startsWith('localhost') || txt.startsWith('0.0.0.0');
    const protocol = isLocal ? 'ws' : 'wss';
    return `${protocol}://${txt}`;
  },
} as const;
