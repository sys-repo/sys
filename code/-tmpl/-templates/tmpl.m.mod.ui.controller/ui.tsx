import React from 'react';
import { type t, Color, css, D, Obj } from './common.ts';

export const Uncontrolled: React.FC<t.MyCtrl.Props> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      padding: 10,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`🐷 ${D.displayName}`}</div>
    </div>
  );
};
