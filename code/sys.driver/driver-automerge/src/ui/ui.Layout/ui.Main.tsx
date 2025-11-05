import React from 'react';
import { type t, Color, Cropmarks, css, D, ErrorBoundary, Is } from './common.ts';
import { renderCtx, toCropmarksConfig } from './u.ts';
import { Spinner } from './ui.Spinner.tsx';

type P = t.LayoutProps;

/**
 * Component:
 */
export const Main: React.FC<P> = (props) => {
  const { debug = false, slots, spinning } = props;
  const render = renderCtx(props);
  const cropmarksConfig = toCropmarksConfig(props.cropmarks);
  const isSpinning = Is.record(spinning) && spinning.main === true;

  const elBody = render.ready ? slots?.main?.(render.ctx) : null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid' }),
    body: css({ position: 'relative', display: 'grid' }),
    empty: css({ padding: 10, backgroundColor: Color.ruby() }),
    cropmarks: css({
      Absolute: 0,
      opacity: isSpinning || !render.ready || !elBody ? 0 : 1,
      transition: D.spinningTransition,
    }),
  };

  const elCropmarks = (
    <Cropmarks {...cropmarksConfig} theme={theme.name} style={styles.cropmarks}>
      <div className={styles.body.class}>{elBody}</div>
    </Cropmarks>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elCropmarks}
      {isSpinning && <Spinner theme={theme.name} />}
    </div>
  );
};
