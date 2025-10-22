import React from 'react';
import { type t, Color, Cropmarks, css } from './common.ts';
import { renderCtx, toCropmarksConfig } from './u.ts';

type P = t.CrdtLayoutProps;

/**
 * Component:
 */
export const Main: React.FC<P> = (props) => {
  const { debug = false, slots } = props;
  const render = renderCtx(props);
  const cropmarksConfig = toCropmarksConfig(props.cropmarks);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
    body: css({ position: 'relative', display: 'grid' }),
    empty: css({ padding: 10, backgroundColor: Color.ruby() }),
  };

  const elEmpty = <div className={styles.empty.class}>{'🐷 slot: main'}</div>;
  const el = render.ready ? slots?.main?.(render.ctx) : null;

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks {...cropmarksConfig} theme={theme.name}>
        <div className={styles.body.class}>{el ?? elEmpty}</div>
      </Cropmarks>
    </div>
  );
};
