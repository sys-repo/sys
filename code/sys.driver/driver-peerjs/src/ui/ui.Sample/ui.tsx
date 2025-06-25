import React from 'react';
import { type t, Color, Crdt, css, D, Media, ObjectView } from './common.ts';

export const Sample: React.FC<t.SampleProps> = (props) => {
  const { debug = false, doc, peer, remoteStream } = props;

  /**
   * Hooks:
   */
  const readyRef = React.useRef(false);
  const [localStream, setLocalStream] = React.useState<MediaStream>();

  /**
   * Effects:
   */
  Crdt.UI.useRedrawEffect(doc, (e) => {});

  /**
   * Effect: Ready.
   */
  React.useEffect(() => {
    if (!localStream || !peer) return;
    if (readyRef.current) return;
    readyRef.current = true;

    const self = { stream: localStream, peer: peer.id };
    props.onReady?.({ self });
  }, [!!localStream, !!peer]);

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
        position: 'relative',
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
        aspectRatio: '16/9',
        width: 160,
      }),
    },
  };

  const elDebug = debug && (
    <div className={styles.debug.class}>
      <div>{`🐷 ${D.displayName}`}</div>
      <ObjectView
        theme={theme.name}
        name={'debug'}
        data={{ peer, room: doc?.current }}
        style={styles.obj}
        expand={['$', '$.room', '$.room.connections', '$.room.connections.group']}
      />
    </div>
  );

  const elSelf = (
    <div className={css(styles.video.base, { Absolute: [null, null, 20, 20] }).class}>
      <Media.Video.UI.Stream
        style={styles.video.stream}
        aspectRatio={'16/9'}
        borderRadius={10}
        muted={true}
        onReady={(e) => {
          console.info(`⚡️ MediaStream.onReady:`, e);
          Media.Log.tracks('- stream.raw:', e.stream.raw);
          Media.Log.tracks('- stream.filtered:', e.stream.filtered);
          setLocalStream(e.stream.filtered);
        }}
      />
      <div className={styles.video.border.class} />
    </div>
  );

  const elRemote = remoteStream && (
    <div className={css(styles.video.base, { Absolute: [null, 20, 20, null] }).class}>
      <Media.Video.UI.Stream
        style={styles.video.stream}
        aspectRatio={'16/9'}
        borderRadius={10}
        stream={remoteStream}
        muted={false}
        onReady={(e) => {
          console.info(`⚡️ MediaStream.onReady:`, e);
          setLocalStream(e.stream.filtered);
        }}
      />
      <div className={styles.video.border.class} />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elDebug}
      {elSelf}
      {elRemote}
    </div>
  );
};
