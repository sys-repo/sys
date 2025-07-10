import React from 'react';
import { type t, Avatar, Color, Crdt, css, D, Obj, ObjectView, PATH } from './common.ts';
import { Notes } from './ui.Notes.tsx';
import { useAvatarController } from './use.AvatarController.ts';

export const Sample: React.FC<t.SampleProps> = (props) => {
  const { debug = false, doc, repo, peer, onSelect } = props;

  const view = Obj.Path.get<t.SampleView>(doc?.current, PATH.DEV.VIEW, 'Debug');
  const fileshareDocid = Obj.Path.get<string>(doc?.current, PATH.DEV.FILES_REF, '');
  const notesDocid = Obj.Path.get<string>(doc?.current, PATH.DEV.NOTES_REF, '');

  /**
   * Hooks:
   */
  const readyRef = React.useRef(false);
  const self = useAvatarController({ name: 'Self', onSelect });
  const remote = useAvatarController({ name: 'Remote', stream: props.remoteStream, onSelect });
  const fileshare = Crdt.UI.useDoc(repo, fileshareDocid);
  const notes = Crdt.UI.useDoc(repo, notesDocid);

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
    obj: css({ marginTop: 20 }),
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

  const elDebug = (debug || view === 'Debug') && (
    <div className={styles.debug.class}>
      <div>{`🐷 ${D.displayName}`}</div>
      <ObjectView
        theme={theme.name}
        name={'room'}
        data={{
          webrtc: peer,
          doc: doc?.current,
        }}
        style={styles.obj}
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

  const elFileShare = view === 'FileShare' && (
    <Crdt.UI.BinaryFile
      theme={theme.name}
      doc={fileshare.doc}
      path={PATH.DEV.FILES}
      debug={debug}
    />
  );

  const elNotes = view === 'Notes' && (
    <Notes theme={theme.name} doc={notes.doc} path={PATH.DEV.NOTES_REF} />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.base.class}>
        <div className={styles.body.inner.class}>
          {view === 'Debug' && elDebug}
          {elFileShare}
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
