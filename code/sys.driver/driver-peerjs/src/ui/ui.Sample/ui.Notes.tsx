import React from 'react';
import { type t, Color, Crdt, css, Monaco, ObjectView, P, Yaml } from './common.ts';

export type NotesProps = {
  repo?: t.Crdt.Repo;
  room?: t.Crdt.Ref;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Notes: React.FC<NotesProps> = (props) => {
  const { debug = false, repo, room } = props;
  const docId = P.DEV.notesRef.get(room?.current, '');
  const path = P.NOTES.text.path;

  /**
   * Hooks:
   */
  const [editor, setEditor] = React.useState<t.Monaco.Editor>();
  const [selectedPath, setSelectedPath] = React.useState<t.ObjectPath>([]);
  const notes = Crdt.UI.useDoc(repo, docId);
  Monaco.useBinding(editor, notes.doc, path);

  /**
   * Effects:
   */
  React.useEffect(() => {
    if (!notes.doc) return;
    const syncer = Yaml.syncer(notes.doc, path);
    return syncer.dispose;
  }, [notes.doc?.instance]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
    }),
    editor: css({
      Absolute: 0,
      display: notes.doc ? 'block' : 'none',
      opacity: debug ? 0.3 : 1,
      filter: `blur(${debug ? 5 : 0}px)`,
      transition: 'filter 80ms ease',
    }),
    notReady: css({
      Absolute: 0,
      userSelect: 'none',
      opacity: notes.doc ? 1 : 0.2,
      transition: `opacity 120ms ease`,
      display: 'grid',
      placeItems: 'center',
    }),
    debug: css({
      Absolute: 0,
      padding: 20,
      backgroundColor: Color.ruby(),
    }),
  };

  const elNotReady = !notes.doc && (
    <div className={styles.notReady.class}>{'( Notes target not ready )'}</div>
  );

  const elDebug = debug && (
    <div className={styles.debug.class}>
      <ObjectView
        theme={theme.name}
        expand={2}
        name={'notes.crdt'}
        data={{
          id: docId,
          doc: notes.doc?.current,
        }}
      />
    </div>
  );

  const elSelectedPath = (
    <Monaco.Dev.PathView
      path={selectedPath}
      theme={theme.name}
      style={{ Absolute: [-25, 17, null, 12] }}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <Monaco.Editor
        theme={theme.name}
        style={styles.editor}
        enabled={!!notes.doc}
        readOnly={debug}
        autoFocus={true}
        language={'yaml'}
        onReady={(e) => {
          setEditor(e.editor);
          const path = Monaco.Yaml.observePath(e.editor, e.dispose$);
          path.$.subscribe((e) => setSelectedPath(e.path));
        }}
      />
      {elNotReady}
      {elDebug}
      {elSelectedPath}
    </div>
  );
};
