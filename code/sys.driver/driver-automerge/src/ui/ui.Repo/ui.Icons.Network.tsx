import React from 'react';
import { type t, Color, css, Icons, Str } from './common.ts';

export type NetworkIconsProps = {
  enabled?: boolean;
  repo?: t.Crdt.Repo;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const NetworkIcons: React.FC<NetworkIconsProps> = (props) => {
  const { repo, enabled = true } = props;
  if (!repo) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      opacity: enabled ? 1 : 0.35,
      transition: 'opacity 200ms ease',
      display: 'grid',
      gridTemplateColumns: 'auto auto',
      placeItems: 'center',
      columnGap: 3,
    }),
  };

  const tooltip = wrangle.tooltips(repo, enabled);
  return (
    <div className={css(styles.base, props.style).class}>
      <Icons.Person size={14} tooltip={tooltip.peer} />
      <Icons.Network.Antenna size={14} tooltip={tooltip.network} />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  tooltips(repo: t.Crdt.Repo, enabled: boolean) {
    const servers = repo.sync.urls.map((url) => `• ${url}`).join('\n');
    return {
      peer: enabled ? wrangle.tooltip.peer(repo, enabled) : 'Offline',
      network: enabled ? `Online: \n${servers}` : 'Offline',
    } as const;
  },

  tooltip: {
    peer(repo: t.Crdt.Repo, enabled: boolean) {
      const peers = repo.sync.peers;
      const total = peers.length;
      const title = `Sync Peer${Str.plural(total, '', 's')}`;
      let names =
        total === 1
          ? peers[0]
          : peers
              .map((n) => `• ${n}`)
              .join('\n')
              .trimEnd();
      if (total > 1) names = `\n${names}`;
      return `${title}: ${names}`;
    },
  },
} as const;
