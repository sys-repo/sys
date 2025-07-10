import React from 'react';
import { type t, Color, Crdt, css, P } from './common.ts';

export type FileshareProps = {
  repo?: t.Crdt.Repo;
  room?: t.Crdt.Ref;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Fileshare: React.FC<FileshareProps> = (props) => {
  const { debug = false, repo, room } = props;
  const docId = P.DEV.filesRef.get(room?.current, '');

  /**
   * Hooks:
   */
  const fileshare = Crdt.UI.useDoc(repo, docId);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid' }),
    editor: css({ Absolute: 0 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Crdt.UI.BinaryFile
        theme={theme.name}
        style={styles.editor}
        doc={fileshare.doc}
        path={P.DEV.files.path}
        debug={debug}
      />
    </div>
  );
};
