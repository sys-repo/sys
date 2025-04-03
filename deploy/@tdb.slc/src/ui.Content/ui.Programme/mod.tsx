import React from 'react';
import { type t, Color, css, Sheet, VIDEO, AppContent, Button, DEFAULTS } from '../ui.ts';

/**
 * Content: "Programme"
 */
export function factory() {
  const id: t.ContentStage = 'Programme';
  const sheetTheme = DEFAULTS.theme.sheet;
  const content: t.Content = {
    id,

    render(props) {
      const styles = {
        base: css({ padding: 10 }),
      };

      return (
        <Sheet {...props} theme={sheetTheme}>
          <div className={styles.base.class}>Hello Programme</div>
          {/* {props.children} */}
        </Sheet>
      );
    },

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
      <div>{`🐷 Body: Programme`}</div>
    </div>
  );
};
