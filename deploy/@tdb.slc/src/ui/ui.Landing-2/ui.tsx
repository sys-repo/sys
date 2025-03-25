import React from 'react';
import { type t, Color, css } from './common.ts';

import { CanvasMini } from '../ui.Canvas.Mini/mod.ts';
import { Logo } from '../ui.Logo/mod.ts';
import { VideoBackgroundTubes } from '../ui.Video.Background.Tubes/mod.ts';

export const Landing: React.FC<t.Landing2Props> = (props) => {
  const { debug = false, backgroundVideo = 0 } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      containerType: 'inline-size',
      color: theme.fg,
    }),
    background: css({ Absolute: 0 }),
    body: css({ Absolute: 0, overflow: 'hidden', display: 'grid', placeItems: 'center' }),

    canvas: css({
      backgroundColor: 'rgba(255, 0, 0, 0.2)' /* RED */,
      aspectRatio: '1.93/1',
      width: 400,
    }).container('max-width: 550px', {
      // Mobile screen:
      width: 200,
    }).done,
  };

  const elBackground = backgroundVideo !== undefined && (
    <VideoBackgroundTubes opacity={backgroundVideo} style={styles.background} />
  );

  const elCanvas = <div className={styles.canvas.class}>canvas</div>;
  // <CanvasMini theme={theme.name} />

  return (
    <div className={css(styles.base, props.style).class}>
      {elBackground}
      <div className={styles.body.class}>
        {elCanvas}
        <Logo theme={theme.name} />
      </div>
    </div>
  );
};
