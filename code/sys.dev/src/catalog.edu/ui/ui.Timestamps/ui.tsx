import React from 'react';
import { type t, Color, css, D, KeyValue } from './common.ts';

export const Timestamps: React.FC<t.TimestampsProps> = (props) => {
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
      <KeyValue.View
        theme={theme.name}
        items={[
        ]}
      />
    </div>
  );
};
