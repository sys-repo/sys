import React from 'react';
import { type t, Color, Crdt, css, D } from './common.ts';
import { edgeBorder, renderCtx } from './u.ts';

type P = t.CrdtLayoutProps;

/**
 * Component:
 */
export const Footer: React.FC<P> = (props) => {
  const { debug = false, crdt, slots } = props;
  const storageKey = crdt?.localstorage;
  const render = renderCtx(props);

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
      repo={crdt?.repo}
      localstorage={storageKey}
      mode={'switch + network-icons'}
      theme={theme.name}
    />
  );

  const elSlot = render.ready ? slots?.footer?.(render.ctx) : undefined;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.left.class}>{elSlot}</div>
      <div />
      <div className={styles.right.class}>{elRepoSwitch}</div>
    </div>
  );
};
