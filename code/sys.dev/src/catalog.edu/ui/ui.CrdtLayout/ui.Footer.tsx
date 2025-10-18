import React from 'react';
import { type t, Color, Crdt, css, D } from './common.ts';
import { edgeBorder, slotCtx } from './u.ts';

type P = t.CrdtLayoutProps;

/**
 * Component:
 */
export const Footer: React.FC<P> = (props) => {
  const { debug = false, repo, header, slots } = props;
  const ctx = slotCtx(props);
  const storageKey = header?.localstorage ?? D.header.localstorage;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      borderTop: edgeBorder(theme),
      color: theme.fg,
      Padding: [8, 10],
      overflow: 'hidden',
      boxSizing: 'border-box',
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
    }),
    left: css({}),
    right: css({}),
  };

  const elRepoSwitch = (
    <Crdt.UI.Repo.SyncEnabledSwitch
      repo={repo}
      localstorage={storageKey}
      mode={'switch + network-icons'}
      theme={theme.name}
    />
  );

  const elSlot = slots?.footer?.(ctx);

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.left.class}>{elSlot}</div>
      <div />
      <div className={styles.right.class}>{elRepoSwitch}</div>
    </div>
  );
};
