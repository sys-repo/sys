import React from 'react';
import { type t, Color, Crdt, css, D, Is } from './common.ts';
import { edgeBorder, renderCtx } from './u.ts';
import { Spinner } from './ui.Spinner.tsx';

type P = t.CrdtLayoutProps;

/**
 * Component:
 */
export const Footer: React.FC<P> = (props) => {
  const { debug = false, crdt, slots, spinning } = props;
  const storageKey = crdt?.storageKey;
  const render = renderCtx(props);
  const isSpinning = Is.record(spinning) && spinning.footer === true;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      borderTop: edgeBorder(theme),
      color: theme.fg,
      overflow: 'hidden',
    }),
    body: css({
      Padding: [8, 10],
      boxSizing: 'border-box',
      opacity: isSpinning ? 0 : 1,
      transition: D.spinningTransition,
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
      <div className={styles.body.class}>
        <div className={styles.left.class}>{elSlot}</div>
        <div />
        <div className={styles.right.class}>{elRepoSwitch}</div>
      </div>
      {isSpinning && <Spinner theme={theme.name} />}
    </div>
  );
};
