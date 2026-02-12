import React from 'react';
import { type t, Color, css, D, KeyValue, Obj } from './common.ts';

export const Uncontrolled: React.FC<t.MyCtrlProps> = (props) => {
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
      <KeyValue.UI
        theme={theme.name}
        items={[
          { kind: 'title', v: D.displayName },
          { k: 'message', v: '👋 hello, world!' },
        ]}
      />
    </div>
  );
};
