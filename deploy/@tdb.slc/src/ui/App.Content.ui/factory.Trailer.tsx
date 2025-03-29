import React from 'react';
import { type t, CanvasMini, Color, css, Logo, Player, VIDEO } from './common.ts';
import { Sheet } from './ui.ts';

const signals = Player.Video.signals({ src: VIDEO.Trailer.src });

/**
 * Content: "Trailer" (30 second intro)
 */
export function factory() {
  const id: t.Stage = 'Trailer';
  const sheetTheme: t.CommonTheme = 'Light';
  const content: t.Content = {
    id,
    video: { src: VIDEO.Trailer.src },
    render(props) {
      const styles = {
        base: css({ display: 'grid', gridTemplateRows: '1fr auto' }),
        children: css({ display: 'grid' }),
      };

      return (
        <Sheet {...props} theme={sheetTheme}>
          <div className={styles.base.class}>
            <div className={styles.children.class}>{props.children}</div>
            <Player.Video.View signals={signals} />
          </div>
        </Sheet>
      );
    },
    timestamps: {
      '00:00:00.000': {
        render(props) {
          // return null;
          return <Body {...props} theme={sheetTheme} />;
        },
      },
      '00:00:03.000': {
        render(props) {
          // return null;
          return <Body {...props} theme={sheetTheme} />;
        },
      },
    },
  };
  return content;
}

/**
 * Component:
 */
export type BodyProps = t.ContentTimestampProps;
export const Body: React.FC<BodyProps> = (props) => {
  const { state, timestamp } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', display: 'grid', placeItems: 'center' }),
    body: css({ display: 'grid', placeItems: 'center', rowGap: '40px' }),
    logo: css({ width: 130, MarginX: 40 }),
    canvas: css({ MarginX: 40 }),

    tmp: css({
      Absolute: [6, 6, null, null],
      fontSize: 12,
      opacity: 0.4,
      pointerEvents: 'none',
    }),
  };

  const elTmp = <div className={styles.tmp.class}>{props.timestamp}</div>;

  return (
    <div className={css(styles.base, props.style).class}>
      {elTmp}
      <div className={styles.body.class}>
        <CanvasMini theme={theme.name} style={styles.canvas} width={300} />
        <Logo theme={theme.name} style={styles.logo} />
      </div>
    </div>
  );
};
