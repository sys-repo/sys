import React from 'react';
import { TextEditor } from '../ui.TextEditor/mod.ts';
import { type t, Color, css, D } from './common.ts';

export const TextPanel: React.FC<t.TextPanelProps> = (props) => {
  const { debug = false, label = D.label, doc, path } = props;

  /**
   * Effect: warnings.
   */
  React.useEffect(() => {
    if (props.warnings) {
      if (!path) console.warn('`path` property not specified.');
      if (!doc) console.warn('`doc` property not specified.');
    }
  }, [!!path, props.warnings]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
      rowGap: props.rowGap ?? 8,
    }),
    label: css({
      fontSize: 11,
      fontWeight: 600,
      textTransform: 'uppercase',
      userSelect: 'none',
      opacity: props.labelOpacity ?? 0.4,
    }),
    editor: css({
      backgroundColor: Color.ruby(debug),
      fontSize: 12,
      overflow: 'hidden',
      display: 'grid', // NB:
    }),
  };

  const elTextbox = (
    <TextEditor doc={doc} path={path} style={styles.editor} scroll={false} theme={theme.name} />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.label.class}>{label}</div>
      {elTextbox}
    </div>
  );
};
