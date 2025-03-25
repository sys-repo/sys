import React from 'react';
import { type t, Color, css } from './common.ts';

import { CanvasMini } from '../ui.Canvas.Mini/mod.ts';
import { Logo } from '../ui.Logo/mod.ts';
import { VideoBackgroundTubes } from '../ui.Video.Background.Tubes/mod.ts';
import { useKeyboard } from '../ui.Landing-1/use.Keyboard.ts';

export const Landing: React.FC<t.Landing2Props> = (props) => {
  const { debug = false, backgroundVideo = 0 } = props;

  useKeyboard();

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      containerType: 'size',
      color: theme.fg,
      backgroundColor: theme.bg,
    }),
    background: css({ Absolute: 0 }),
    body: css({ Absolute: 0, overflow: 'hidden', display: 'grid', placeItems: 'center' }),

    canvas: css({
      width: 400,
      transition: 'width 200ms',
    })
      .container('max-width: 550px', { width: 350 })
      .container('max-width: 450px', { width: 280 }).done,

    logo: css({ Absolute: [null, 15, 12, null] })
      .container('max-height: 470px', { Absolute: null })
      .container('max-height: 470px', { display: 'none' }).done,
  };

  const elBackground = backgroundVideo !== undefined && (
    <VideoBackgroundTubes opacity={backgroundVideo} style={styles.background} />
  );

  const elCanvas = (
    <div className={styles.canvas.class}>
      <CanvasMini theme={theme.name} />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elBackground}
      <div className={styles.body.class}>
        {elCanvas}
        <Logo theme={theme.name} style={styles.logo} />
      </div>
    </div>
  );
};
