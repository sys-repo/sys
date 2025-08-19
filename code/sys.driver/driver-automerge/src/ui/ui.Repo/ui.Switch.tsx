import React from 'react';

import { type t, Color, css, D, Switch, SwitchTheme } from './common.ts';
import { LabelStyle } from './u.Style.ts';
import { DefaultDetails } from './ui.Default.tsx';
import { NetworkIcons } from './ui.Icons.Network.tsx';
import { useController } from './use.Controller.ts';

type P = t.SyncEnabledSwitchProps;

/**
 * Component:
 */
export const SyncEnabledSwitch: React.FC<P> = (props) => {
  const { repo, mode = D.mode } = props;
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
  const switchTheme = wrangle.switchTheme(props, controller.peers);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      userSelect: 'none',
      fontSize: 11,
      maxWidth: '100%',
      overflow: 'hidden',
      //
      display: 'grid',
      justifyContent: 'start',
    }),
    body: css(LabelStyle.base, { columnGap: 8 }),
    dim: LabelStyle.dim,
  };

  const elDefault = mode === 'default' && (
    <DefaultDetails repo={repo} enabled={enabled} theme={theme.name} />
  );

  const elNetworkIcons = mode === 'switch + network-icons' && (
    <NetworkIcons repo={repo} enabled={enabled} theme={theme.name} />
  );

  return (
    <div className={css(styles.base, props.style).class} onMouseDown={toggleEnabled}>
      <div className={styles.body.class}>
        <Switch value={enabled} theme={switchTheme} height={16} onMouseDown={onClick} />
        {elDefault}
        {elNetworkIcons}
      </div>
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  switchTheme(props: P, peers: t.PeerId[]) {
    const theme = Color.theme(props.theme);
    const base = SwitchTheme.fromName(theme.name);
    return peers.length > 0 ? base.default : base.yellow;
  },
} as const;
