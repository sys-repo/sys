import React from 'react';
import { type t, Color, css } from './common.ts';

export function factory() {
  const id: t.Stage = 'Entry';
  const content: t.Content = {
    id,
    timestamps: {
      '00:00:00.000': {
        render(props) {
          return <Body {...props} />;
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
      <div>{`🐷 Body: Entry`}</div>
    </div>
  );
};
