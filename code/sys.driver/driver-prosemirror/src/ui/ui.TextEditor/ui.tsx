import React from 'react';

import { type t, Color, css, D } from './common.ts';
import { EditorStyles } from './u.styles.ts';
import { useProsemirror } from './use.Prosemirror.ts';

export const TextEditor: React.FC<t.TextEditorProps> = (props) => {
  const {
    readOnly = D.readOnly,
    scroll = D.scroll,
    singleLine = D.singleLine,
    debug = false,
  } = props;

  /**
   * Hooks:
   */
  const { ref, editor } = useProsemirror(props);

  /**
   * Effect - sync/autoFocus:
   */
  React.useEffect(() => {
    if (props.autoFocus) editor?.focus?.();
  }, [editor, props.autoFocus]);

  /**
   * Effect - sync/read-only:
   */
  React.useEffect(() => {
    if (editor) editor.setProps({ editable: () => !readOnly });
  }, [editor, readOnly]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const noWrap: t.CssProps = {
    whiteSpace: 'nowrap',
    overflowX: 'hidden',
    overflowY: 'hidden',
  };
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      zIndex: 0,
      display: scroll ? 'grid' : undefined,
    }),

    body: EditorStyles.body({
      backgroundColor: Color.ruby(debug),
      Absolute: scroll || singleLine ? 0 : undefined,
      Scroll: singleLine ? false : scroll,
    }).rule('p', singleLine ? noWrap : {}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div ref={ref} className={styles.body.class} />
    </div>
  );
};
