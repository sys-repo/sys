import React from 'react';

import { type t, Color, css, Icons, Switch } from './common.ts';
import { LabelStyle } from './u.Style.ts';
import { EndpointLabel } from './ui.Switch.Endpoint.tsx';
import { PeerLabel } from './ui.Switch.Peer.tsx';
import { useController } from './use.Controller.ts';

type P = t.SyncEnabledSwitchProps;

/**
 * Component:
 */
export const SyncEnabledSwitch: React.FC<P> = (props) => {
  const { repo } = props;
  const peerId = repo?.id.peer ?? '';
  const urls = repo?.sync.urls ?? [];

  /**
   * Hooks:
   */
  const controller = useController(props);
  const enabled = controller.enabled;
  const prefixLabel = enabled && urls.length > 0 ? 'network:' : repo ? 'private' : 'no repository';

  /**
   * Handlers:
   */
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleEnabled();
  };
  const toggleEnabled = () => {
    const next = !enabled;
    controller.updatedEnabled(next);
    props.onChange?.({ enabled: next });
  };

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      justifyContent: 'start',
      userSelect: 'none',
      fontSize: 11,
    }),
    body: css(LabelStyle.base, { columnGap: 6 }),
    dim: LabelStyle.dim,
  };

  return (
    <div className={css(styles.base, props.style).class} onMouseDown={toggleEnabled}>
      <div className={styles.body.class}>
        <Switch value={enabled} theme={theme.name} height={16} onMouseDown={onClick} />
        <span className={styles.dim.class}>{prefixLabel}</span>
        {urls.length > 0 && enabled && <EndpointLabel urls={urls} />}
        {peerId && enabled && <span className={styles.dim.class}>{'•'}</span>}
        {peerId && enabled && <PeerLabel peerId={peerId} />}
        {peerId && enabled && <Icons.Person color={theme.fg} size={16} opacity={1} />}
      </div>
    </div>
  );
};
