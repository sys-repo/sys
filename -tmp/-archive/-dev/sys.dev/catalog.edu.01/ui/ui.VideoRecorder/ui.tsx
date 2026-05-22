import React from 'react';

import { type t, Color, Cropmarks, css, D, Spinners } from './common.ts';
import { Config } from './ui.Config.tsx';
import { Main } from './ui.Main.tsx';

type P = t.VideoRecorderViewProps;

export const VideoRecorderView: React.FC<P> = (props) => {
  const { debug = false, aspectRatio = D.aspectRatio } = props;
  const spinning = wrangle.spinning(props);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      gridTemplateColumns: `1fr auto`,
    }),
    left: css({ position: 'relative', display: 'grid' }),
    right: css({
      position: 'relative',
      borderLeft: `solid 1px ${Color.alpha(theme.fg, 0.1)}`,
      display: 'grid',
      minWidth: 330,
    }),
    main: css({
      opacity: spinning.main ? 0 : 1,
      transition: `opacity 120ms ease`,
    }),
    spinner: css({
      Absolute: 0,
      pointerEvents: 'none',
      display: 'grid',
      placeItems: 'center',
    }),
  };

  const elSpinning = spinning.main && (
    <div className={styles.spinner.class}>
      <Spinners.Bar theme={theme.name} />
    </div>
  );

  const elMain = (
    <div className={styles.left.class}>
      <Cropmarks
        style={styles.main}
        theme={theme.name}
        size={{ mode: 'percent', aspectRatio, width: 80 }}
        borderOpacity={0.05}
      >
        <Main {...props} />
      </Cropmarks>
      {elSpinning}
    </div>
  );

  const elConfig = (
    <div className={styles.right.class}>
      <Config {...props} />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elMain}
      {elConfig}
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  spinning(props: P): t.CrdtView.LayoutSpinning {
    const { signals } = props;
    let main = false;
    if (!signals?.stream.value) main = true;
    return { main };
  },
} as const;
