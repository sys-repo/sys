import React from 'react';
import { type t, Color, css, D, ObjectView } from './common.ts';

export const Sample: React.FC<t.SampleProps> = (props) => {
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
      <ObjectView data={props.doc} />
    </div>
  );
};
