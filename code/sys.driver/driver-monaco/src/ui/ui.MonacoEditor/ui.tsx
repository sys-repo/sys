import React from 'react';
import { type t, Color, css, D } from './common.ts';

export const MonacoEditor: React.FC<t.MonacoEditorProps> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`🐷 ${D.displayName}`}</div>
    </div>
  );
};
