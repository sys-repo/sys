import React from 'react';

import { type t, Color, css, D, Switch, SwitchTheme } from './common.ts';
import { getStatus } from './u.status.ts';
import { LabelStyle } from './u.Style.ts';
import { DefaultDetails } from './ui.SyncSwitch.DefaultDetails.tsx';
import { NetworkIcons } from './ui.Icons.Network.tsx';
import { useController } from './use.SyncSwitch.Controller.ts';

type P = t.RepoSyncSwitchProps;

export const SyncSwitch: React.FC<P> = (props) => {
  const { repo, mode = D.mode } = props;

  /**
   * Hooks:
   */
  const controller = useController(props);
  const enabled = controller.enabled;
  const pending = controller.pending;
  const status = repo ? getStatus(repo) : undefined;

  /**
   * Handlers:
   */
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleEnabled();
  };
  const toggleEnabled = () => {
    if (pending) return;
    const next = !enabled;
    controller.updatedEnabled(next);
    props.onChange?.({ enabled: next });
  };

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const switchTheme = wrangle.switchTheme(props, status);
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
        <Switch
          theme={switchTheme}
          height={16}
          value={enabled || false}
          onMouseDown={handleClick}
        />
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
  switchTheme(props: P, status?: t.RepoInfoStatus) {
    const theme = Color.theme(props.theme);
    const base = SwitchTheme.fromName(theme.name);

    if (!status) return base.yellow;

    switch (status.status) {
      case 'online':
        return base.default;
      case 'connecting':
      case 'offline':
      default:
        return base.yellow;
    }
  },
} as const;
