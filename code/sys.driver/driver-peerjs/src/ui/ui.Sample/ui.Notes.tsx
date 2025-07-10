import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, D, DEFAULTS, rx, Crdt } from './common.ts';
import { Monaco } from '@sys/driver-monaco';

export type NotesProps = {
  doc?: t.Crdt.Ref<t.SampleDoc>;
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
  Monaco.useBinding(editor, doc, path, (e) => {
  });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
    }),
    editor: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Monaco.Editor
        theme={theme.name}
        style={styles.editor}
        autoFocus={true}
        language={'yaml'}
        onReady={(e) => setEditor(e.editor)}
      />
    </div>
  );
};
