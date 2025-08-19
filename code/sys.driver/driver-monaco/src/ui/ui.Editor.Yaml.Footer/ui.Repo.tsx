import React, { useState } from 'react';
import { type t, Color, Crdt, css } from './common.ts';

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

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
    icon: css({
      opacity: enabled ? 1 : 0.35,
      transition: 'opacity 200ms ease',

      display: 'grid',
      gridTemplateColumns: 'auto auto',
      placeItems: 'center',
      columnGap: 3,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Crdt.UI.Repo.SyncEnabledSwitch
        theme={theme.name}
        repo={repo}
        localstorage={crdt.localstorage}
        mode={'switch + network-icons'}
        onChange={(e) => setEnabled(e.enabled)}
      />
    </div>
  );
};
