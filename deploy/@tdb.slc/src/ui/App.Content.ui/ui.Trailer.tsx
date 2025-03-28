import React from 'react';
import { type t, Color, css, VIDEO, withThemeMethods } from './common.ts';

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
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      color: theme.fg,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`🐷 Body: ${state?.props.content.value?.id}`}</div>
    </div>
  );
};
