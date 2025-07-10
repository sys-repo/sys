import { Monaco } from '@sys/driver-monaco';
import React from 'react';
import { type t, Color, css } from './common.ts';

export type NotesProps = {
  doc?: t.Crdt.Ref;
  path?: t.ObjectPath;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Notes: React.FC<NotesProps> = (props) => {
  const { doc, path } = props;

  /**
   * Hooks:
   */
  const [editor, setEditor] = React.useState<t.Monaco.Editor>();
  Monaco.useBinding(editor, doc, path);

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
    editor: css({ display: doc ? 'block' : 'none' }),
    notReady: css({
      Absolute: 0,
      userSelect: 'none',
      opacity: doc ? 1 : 0.2,
      transition: `opacity 120ms ease`,
      display: 'grid',
      placeItems: 'center',
    }),
  };

  const elNotReady = !doc && (
    <div className={styles.notReady.class}>{'( Notes target not ready )'}</div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <Monaco.Editor
        theme={theme.name}
        style={styles.editor}
        enabled={!!doc}
        autoFocus={true}
        language={'yaml'}
        onReady={(e) => setEditor(e.editor)}
      />
      {elNotReady}
    </div>
  );
};
