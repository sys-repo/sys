import React, { useState } from 'react';
import { type t, Color, Crdt, css, Icons, usePointer } from './common.ts';

export type RepoProps = {
  crdt?: t.YamlEditorFooterCrdt;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Repo: React.FC<RepoProps> = (props) => {
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
      alignItems: 'center',
      columnGap: 5,
    }),
    icon: css({
      opacity: enabled ? 1 : 0.4,
      transition: 'opacity 200ms ease',
      display: 'grid',
      placeItems: 'center',
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

  const Icon = enabled ? Icons.Network.On : Icons.Network.Off;

  return (
    <div className={css(styles.base, props.style).class} {...pointer.handlers}>
      <div className={styles.icon.class}>
        <Icon size={17} />
      </div>
      {elRepo}
    </div>
  );
};
