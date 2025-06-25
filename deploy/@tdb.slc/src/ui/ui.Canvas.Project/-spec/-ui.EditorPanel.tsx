import React from 'react';
import { type t, Button, Color, Crdt, css, Icons } from '../common.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

export type EditorPanelProps = {
  debug: DebugSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const EditorPanel: React.FC<EditorPanelProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const doc = p.doc.value;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid', gridTemplateRows: 'auto 1fr' }),
    body: css({ position: 'relative' }),
    desc: {
      base: css({
        position: 'relative',
        height: 80,
        borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.15)}`,
        Padding: [25, 10, 10, 10],
        display: 'grid',
      }),
      label: css({
        Absolute: [5, null, null, 10],
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        userSelect: 'none',
        opacity: 0.5,
      }),
      editor: css({ fontSize: 12, overflow: 'hidden' }),
    },
    closeBtn: css({ Absolute: [4, 5, null, null] }),
  };

  const elCloseButton = (
    <Button style={styles.closeBtn} onClick={() => (p.showEditorPanel.value = false)}>
      <Icons.Close size={20} />
    </Button>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.desc.base.class}>
        <div className={styles.desc.label.class}>{'Description'}</div>
        <Crdt.UI.TextEditor
          doc={doc}
          path={['project', 'description']}
          style={styles.desc.editor}
          scroll={false}
        />
        {elCloseButton}
      </div>
      <div className={styles.body.class}></div>
    </div>
  );
};
