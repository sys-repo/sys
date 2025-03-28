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
          return <div>👋</div>;
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
  const { state } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      placeItems: 'center',
    }),
    body: css({
      display: 'grid',
      placeItems: 'center',
      rowGap: '50px',
    }),
    logo: css({ width: 150 }),
    canvas: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <CanvasMini theme={theme.name} style={styles.canvas} width={300} />
        <Logo theme={theme.name} style={styles.logo} />
      </div>
    </div>
  );
};
