import React from 'react';
import { type t, Color, css, Icons } from './common.ts';
import { LabelStyle } from './u.Style.ts';
import { EndpointLabel } from './ui.Switch.Endpoint.tsx';
import { PeerLabel } from './ui.Switch.Peer.tsx';

export type DefaultDetailsProps = {
  enabled?: boolean;
  repo?: t.Crdt.Repo;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const DefaultDetails: React.FC<DefaultDetailsProps> = (props) => {
  const { debug = false, enabled = true, repo } = props;
  const peerId = repo?.id.peer ?? '';
  const urls = repo?.sync.urls ?? [];
  const prefixLabel = enabled && urls.length > 0 ? 'network:' : repo ? 'private' : 'no repository';

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      gridAutoFlow: 'column',
      columnGap: 8,
      alignItems: 'center',
    }),
    dim: LabelStyle.dim,
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <span className={styles.dim.class}>{prefixLabel}</span>
      {urls.length > 0 && enabled && <EndpointLabel urls={urls} />}
      {peerId && enabled && <span className={styles.dim.class}>{'•'}</span>}
      {peerId && enabled && <PeerLabel peerId={peerId} />}
      {peerId && enabled && <Icons.Person color={theme.fg} size={16} opacity={1} />}
    </div>
  );
};
