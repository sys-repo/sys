import React from 'react';
import { type t, Color, Crdt, css, D, Media, ObjectView } from './common.ts';

export const Sample: React.FC<t.SampleProps> = (props) => {
  const { debug = false, doc, peerjs, remoteStream } = props;

  /**
   * Hooks:
   */
  const readyRef = React.useRef(false);
  const remoteVideoRef = React.useRef<HTMLVideoElement>(null);
  const [selfStream, setSelfStream] = React.useState<MediaStream>();

  /**
   * Effects:
   */
  Crdt.UI.useRedrawEffect(doc, (e) => {});

  /**
   * Effect: Ready.
   */
  React.useEffect(() => {
    if (readyRef.current) return;
    if (!selfStream || !peerjs) return;

    const self = { stream: selfStream, peer: peerjs.id };
    props.onReady?.({ self });

    readyRef.current = true;
  }, [!!selfStream, !!peerjs]);

  /**
   * Effect: Push the incoming stream onto the <video> element.
   */
  React.useEffect(() => {
    const el = remoteVideoRef.current;
    if (el && remoteStream) el.srcObject = remoteStream;
  }, [remoteStream]);

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
        data={{ peerjs, room: doc?.current }}
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
        onReady={(e) => {
          console.info(`⚡️ MediaStream.onReady:`, e);
          setSelfStream(e.stream.filtered);
        }}
      />
      <div className={styles.video.border.class} />
    </div>
  );

  const elRemote = props.remoteStream && (
    <div className={css(styles.video.base, { Absolute: [null, 20, 20, null] }).class}>
      <video ref={remoteVideoRef} className={styles.video.stream.class} autoPlay playsInline />
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
