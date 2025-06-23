import React from 'react';
import { type t, Color, Crdt, css, D, Media, ObjectView } from './common.ts';

export const Sample: React.FC<t.SampleProps> = (props) => {
  const { debug = false, doc, peerjs } = props;

  /**
   * Effects:
   */
  Crdt.UI.useRedrawEffect(doc, (e) => {
  });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      padding: 40,
    }),
    debug: css({}),
    obj: css({ marginTop: 20 }),

    video: {
      base: css({
        Absolute: [null, 20, 20, null],
        display: 'grid',
        width: 160,
      }),
      border: css({
        Absolute: 0,
        pointerEvents: 'none',
        border: `solid 3px ${Color.alpha(theme.fg, 0.8)}`,
        borderRadius: 12,
      }),
      stream: css({
        borderRadius: 12,
        overflow: 'hidden',
      }),
    },
  };

  const elDebug = debug && (
    <div className={styles.debug.class}>
      <div>{`🐷 ${D.displayName}`}</div>
      <ObjectView
        theme={theme.name}
        name={'debug'}
        data={{ peerjs, room: doc?.current }}
        style={styles.obj}
        expand={['$', '$.room', '$.room.connections', '$.room.connections.group']}
      />
    </div>
  );

  const elSelf = (
    <div className={styles.video.base.class}>
      <Media.Video.UI.Stream
        style={styles.video.stream}
        aspectRatio={'16/9'}
        borderRadius={10}
        onReady={(e) => console.info(`⚡️ MediaStream.onReady:`, e)}
      />
      <div className={styles.video.border.class} />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elDebug}
      {elSelf}
    </div>
  );
};
