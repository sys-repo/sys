import React, { useState } from 'react';
import { type t, Color, Crdt, css, Icons, Str, usePointer } from './common.ts';

export type RepoProps = {
  crdt?: t.YamlEditorFooterCrdt;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

type P = RepoProps;

/**
 * Component:
 */
export const Repo: React.FC<P> = (props) => {
  const { crdt = {} } = props;
  const { repo, visible = true } = crdt;
  if (!repo || !visible) return null;

  /**
   * Hooks:
   */
  const [enabled, setEnabled] = useState(repo.sync.enabled);
  const pointer = usePointer({
    onDown(e) {
      e.cancel();

      const next = !repo.sync.enabled;
      repo.sync.enabled = next;
      setEnabled(next);
    },
  });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      gridTemplateColumns: 'auto auto',
      placeItems: 'center',
      columnGap: 8,
    }),
    icon: css({
      opacity: enabled ? 1 : 0.35,
      transition: 'opacity 200ms ease',
      display: 'grid',
      gridTemplateColumns: 'auto auto',
      placeItems: 'center',
      columnGap: 3,
    }),
  };

  const elRepo = (
    <Crdt.UI.Repo.SyncEnabledSwitch
      theme={theme.name}
      repo={repo}
      localstorage={crdt.localstorage}
      mode={'switch-only'}
      onChange={(e) => setEnabled(e.enabled)}
    />
  );

  const tooltip = wrangle.tooltips(repo, enabled);
  const elIcon = (
    <div className={styles.icon.class}>
      <Icons.Person size={14} tooltip={tooltip.peer} />
      <Icons.Network.Antenna size={14} tooltip={tooltip.network} />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class} {...pointer.handlers}>
      {elRepo}
      {elIcon}
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  tooltips(repo: t.Crdt.Repo, enabled: boolean) {
    return {
      peer: enabled ? wrangle.tooltip.peer(repo, enabled) : 'Offline',
      network: enabled ? 'Online' : 'Offline',
    } as const;
  },

  tooltip: {
    peer(repo: t.Crdt.Repo, enabled: boolean) {
      const peers = repo.sync.peers;
      const title = `Sync Peers${Str.plural(peers.length, '', '(s)')}: `;
      let names = peers
        .map((n) => `• ${n}`)
        .join('\n')
        .trimEnd();
      if (peers.length > 1) names = `\n${names}`;
      return `${title}: ${names}`;
    },
  },
} as const;
