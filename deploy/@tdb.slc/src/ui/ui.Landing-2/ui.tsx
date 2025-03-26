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
    body: css({
      Absolute: 0,
      overflow: 'hidden',
      backgroundColor: debug ? 'rgba(255, 0, 0, 0.1)' /* DEBUG:RED */ : '',
      display: 'grid',
    }),

    canvas: {
      base: css({
        backgroundColor: debug ? 'rgba(255, 0, 0, 0.1)' /* DEBUG:RED */ : '',
        display: 'grid',
        placeItems: 'center',
      })
        .container('max-width: 550px', { PaddingX: 75 })
        .container('max-width: 320px', { PaddingX: 50 }).done,
      subject: css({
        width: 400,
        marginBottom: '6%',
      }).container('max-width: 550px', { width: '100%' }).done,
    },

    logo: css({
      Absolute: [null, 10, 15, null],
      width: 150,
      transition: 'width 200ms',
    })
      .container('max-width: 640px', { width: 110 })
      .container('max-height: 470px', { display: 'none' }).done,
  };

  const elBackground = backgroundVideo !== undefined && (
    <VideoBackgroundTubes opacity={backgroundVideo} style={styles.background} />
  );

  const elCanvas = (
    <div className={styles.canvas.base.class}>
      <div className={styles.canvas.subject.class}>
        <CanvasMini theme={theme.name} />
      </div>
    </div>
  );

  const elLogo = <Logo theme={theme.name} style={styles.logo} />;

  const elBody = <div className={styles.body.class}>{elCanvas}</div>;

  return (
    <div className={css(styles.base, props.style).class}>
      {elLogo}
      {elBackground}
      {elBody}
    </div>
  );
};
