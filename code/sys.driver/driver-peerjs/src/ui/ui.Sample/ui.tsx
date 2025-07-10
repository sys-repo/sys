import React from 'react';
import { type t, Avatar, Color, Crdt, css, D, ObjectView, P } from './common.ts';
import { Notes } from './ui.Notes.tsx';
import { useAvatarController } from './use.AvatarController.ts';
import { Fileshare } from './ui.Fileshare.tsx';

export const Sample: React.FC<t.SampleProps> = (props) => {
  const { debug = false, doc, repo, peer, onSelect } = props;

  const view = P.DEV.view.get(doc?.current, 'Debug');

  /**
   * Hooks:
   */
  const readyRef = React.useRef(false);
  const self = useAvatarController({ name: 'Self', onSelect });
  const remote = useAvatarController({ name: 'Remote', stream: props.remoteStream, onSelect });
  const fileshare = Crdt.UI.useDoc(repo, P.DEV.filesRef.get(doc?.current, ''));
  const notes = Crdt.UI.useDoc(repo, P.DEV.notesRef.get(doc?.current, ''));

  /**
   * Effects:
   */
  Crdt.UI.useRedrawEffect(doc, (e) => {});

  /**
   * Effect: Ready.
   */
  React.useEffect(() => {
    if (!self.stream || !peer) return;
    if (readyRef.current) return;
    readyRef.current = true;

    const stream = self.stream;
    props.onReady?.({ self: { stream, peer: peer.id } });
  }, [!!self.stream, !!peer]);

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
      inner: css({ Absolute: 0, overflow: 'hidden', display: 'grid' }),
    },
    debug: css({ padding: 40 }),
    obj: css({ marginTop: 10 }),
    dyad: {
      base: css({
        padding: 15,
        display: 'grid',
        gridTemplateColumns: `auto 1fr auto`,
        borderTop: `dashed 1px ${Color.alpha(theme.fg, 0.1)}`,
      }),
      avatar: css({ width: 120 }),
    },
  };

  const elDebug = view === 'Debug' && (
    <div className={styles.debug.class}>
      <div>{`🐷 ${D.displayName}`}</div>
      <ObjectView
        style={styles.obj}
        theme={theme.name}
        name={'room'}
        data={{
          webrtc: peer,
          doc: doc?.current,
        }}
        expand={['$', '$.doc', '$.doc.connections', '$.doc.connections.group']}
      />
    </div>
  );

  const borderRadius = 10;

  const elSelf = (
    <Avatar
      {...self.handlers}
      stream={self.stream}
      style={styles.dyad.avatar}
      theme={theme.name}
      borderRadius={borderRadius}
      borderWidth={2}
      muted={true}
      flipped={self.flipped}
    />
  );

  const elRemote = remote.stream && (
    <Avatar
      {...remote.handlers}
      stream={remote.stream}
      style={styles.dyad.avatar}
      theme={theme.name}
      borderRadius={borderRadius}
      borderWidth={2}
      muted={false}
      flipped={remote.flipped}
    />
  );

  const elFileshare = view === 'FileShare' && (
    <Fileshare debug={debug} theme={theme.name} repo={repo} room={doc} />
  );

  const elNotes = view === 'Notes' && (
    <Notes debug={debug} theme={theme.name} repo={repo} room={doc} />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.base.class}>
        <div className={styles.body.inner.class}>
          {elDebug}
          {elFileshare}
          {elNotes}
        </div>
      </div>
      <div className={styles.dyad.base.class}>
        {elSelf}
        <div />
        {elRemote}
      </div>
    </div>
  );
};
