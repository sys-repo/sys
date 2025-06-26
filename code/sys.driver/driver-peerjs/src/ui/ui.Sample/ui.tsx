import React from 'react';
import { type t, Avatar, Color, Crdt, css, D, Media, ObjectView } from './common.ts';

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
      backgroundColor: Color.ruby(debug ? 0.06 : 0),
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: `1fr auto`,
    }),
    body: {
      base: css({ position: 'relative' }),
      inner: css({ Absolute: 0, padding: 40, overflow: 'hidden' }),
    },
    debug: css({}),
    obj: css({ marginTop: 20 }),
    dyad: {
      base: css({ padding: 20, display: 'grid', gridTemplateColumns: `auto 1fr auto` }),
      avatar: css({ width: 100 }),
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
    <Avatar
      style={styles.dyad.avatar}
      theme={theme.name}
      borderRadius={10}
      borderWidth={2}
      muted={true}
      onReady={(e) => {
        setLocalStream(e.stream.filtered);

        console.info(`⚡️ MediaStream.onReady (self):`, e);
        Media.Log.tracks('- stream.raw:', e.stream.raw);
        Media.Log.tracks('- stream.filtered:', e.stream.filtered);
      }}
    />
  );

  const elRemote = remoteStream && (
    <Avatar
      style={styles.dyad.avatar}
      theme={theme.name}
      borderRadius={10}
      borderWidth={2}
      muted={false}
      stream={remoteStream}
      onReady={(e) => {
        console.info(`⚡️ MediaStream.onReady (remote):`, e);
      }}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.base.class}>
        <div className={styles.body.inner.class}>{elDebug}</div>
      </div>
      <div className={styles.dyad.base.class}>
        {elSelf}
        <div />
        {elRemote}
      </div>
    </div>
  );
};
