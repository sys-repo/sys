import React from 'react';
import { type t, Color, css } from './common.ts';
import { resolveOrigin } from './u.resolve.ts';
import { Info } from './ui.Info.tsx';
import { OriginSelector } from './ui.Selector.tsx';

type P = t.HttpOriginProps;

export const Uncontrolled: React.FC<P> = (props) => {
  const { debug = false } = props;
  const { origin, kind } = resolveOrigin({ kind: props.env, defaults: props.defaults?.origin });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: Color.ruby(debug),
      fontSize: 12,
      display: 'grid',
      gridTemplateColumns: `auto auto 1fr`,
      gap: 20,
    }),
    selector: css({ display: 'grid', alignItems: 'start' }),
    divider: css({ borderRight: `solid 1px ${Color.alpha(theme.fg, 0.1)}` }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.selector.class}>
        <OriginSelector theme={theme.name} env={props.env} onChange={props.onChange} />
      </div>
      <div className={styles.divider.class} />
      <Info theme={theme.name} kind={kind} origin={origin} />
    </div>
  );
};
