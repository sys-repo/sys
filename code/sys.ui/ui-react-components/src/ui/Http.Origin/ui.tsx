import React from 'react';
import { type t, Color, css } from './common.ts';
import { resolveOrigin } from './u.resolve.ts';
import { Empty } from './ui.Empty.tsx';
import { Info } from './ui.Info.tsx';
import { OriginSelector } from './ui.Selector.tsx';

type P = t.HttpOrigin.Props;

export const Uncontrolled: React.FC<P> = (props) => {
  const { debug = false } = props;
  const { origin, env } = resolveOrigin({ env: props.env, defaults: props.spec });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      fontSize: 13,
      display: 'grid',
    }),
    body: css({
      display: 'grid',
      gridTemplateColumns: `auto auto 1fr`,
      gap: 20,
    }),
    selector: css({ display: 'grid', alignItems: 'start' }),
    divider: css({ borderRight: `solid 1px ${Color.alpha(theme.fg, 0.1)}` }),
    empty: css({}),
  };

  const elEmpty = !origin && <Empty theme={theme.name} style={styles.empty} />;

  const elBody = origin && (
    <div className={styles.body.class}>
      <div className={styles.selector.class}>
        <OriginSelector theme={theme.name} env={props.env} onChange={props.onChange} />
      </div>
      <div className={styles.divider.class} />
      <Info theme={theme.name} env={env} origin={origin} />
    </div>
  );

  return <div className={css(styles.base, props.style).class}>{elEmpty || elBody}</div>;
};
