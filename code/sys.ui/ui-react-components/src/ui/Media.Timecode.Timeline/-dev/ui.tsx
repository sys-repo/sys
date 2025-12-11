import React from 'react';
import { type t, Player, Color, css, D, KeyValue, Obj, Cropmarks } from '../common.ts';

export const Playback: React.FC<t.MediaTimecodePlaybackProps> = (props) => {
  const { debug = false, video } = props;

  /**
   * Behavior/State (hooks):
   */
  const controller = Player.Video.useSignals(video, { log: debug });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: '420px 1fr',
    }),
    top: css({
      display: 'grid',
      borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.05)}`,
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
    }),
    bottom: {
      base: css({
        display: 'grid',
        gridTemplateColumns: `1fr auto`,
      }),
      left: css({ padding: 20 }),
      right: css({
        padding: 20,
        width: 300,
        borderLeft: `solid 1px ${Color.alpha(theme.fg, 0.1)}`,
      }),
    },
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.top.class}>
        <Cropmarks theme={theme.name}>
          <Player.Video.Element
            style={{ width: 420 }}
            debug={debug}
            theme={props.theme}
            {...controller.props}
          />
        </Cropmarks>
      </div>

      <div className={styles.bottom.base.class}>
        <div className={styles.bottom.left.class}>{`Beats List`}</div>
        <div className={styles.bottom.right.class}>
          <KeyValue.View
            theme={theme.name}
            items={[
              { kind: 'title', v: D.displayName },
              { k: 'message', v: '👋 hello, world!' },
            ]}
          />
        </div>
      </div>
    </div>
  );
};
