import React, { useRef } from 'react';
import { type t, Color, css, Player, Sheet, VIDEO } from './common.ts';

export type ColumnProps = {
  body?: t.ReactNode;
  video?: t.VideoPlayerSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Column: React.FC<ColumnProps> = (props) => {
  const {} = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: `1fr auto`,
    }),
    body: css({}),
    footer: css({}),
  };

  return (
    <Sheet theme={theme.name} orientation={'Bottom:Up'} style={props.style}>
      <div className={styles.base.class}>
        <div className={styles.body.class}>{props.body}</div>
        <div className={styles.footer.class}>
          <Player.Video.View
            signals={props.video}
            // onEnded={() => Time.delay(1000, () => state.stack.clear(1))} // NB: add time buffer before hiding.
          />
        </div>
      </div>
    </Sheet>
  );
};
