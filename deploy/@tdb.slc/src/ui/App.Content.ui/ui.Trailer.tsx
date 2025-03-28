import React from 'react';
import { type t, CanvasMini, Color, css, Logo, VIDEO, withThemeMethods } from './common.ts';

export function factory() {
  const id: t.Stage = 'Trailer';
  const content: t.AppContent = {
    id,
    video: { src: VIDEO.Trailer.src },
    timestamps: {
      '00:00:00.000': {
        render(props) {
          return <Body {...props} />;
        },
      },
      '00:00:03.000': {
        render(props) {
          return <Body {...props} />;
        },
      },
    },
  };
  return withThemeMethods(content);
}

/**
 * Component:
 */
export type BodyProps = t.AppTimestampProps;
export const Body: React.FC<BodyProps> = (props) => {
  const { state, timestamp } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      placeItems: 'center',
    }),
    body: css({
      display: 'grid',
      placeItems: 'center',
      rowGap: '40px',
    }),
    logo: css({ width: 150 }),
    canvas: css({}),

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
