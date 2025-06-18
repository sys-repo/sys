import React from 'react';
import { type t, Color, css, D } from './common.ts';

export const CanvasCell: React.FC<t.CanvasCellProps> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      padding: 30,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`🐷 ${D.displayName} | Canvas Cell → <Automerge.Crdt.Card>`}</div>
    </div>
  );
};
