import React from 'react';
import { type t, Color, css, TextEditor } from './common.ts';

export const EditorCanvas: React.FC<t.EditorCanvasProps> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <TextEditor debug={true} theme={theme.name} />
    </div>
  );
};
