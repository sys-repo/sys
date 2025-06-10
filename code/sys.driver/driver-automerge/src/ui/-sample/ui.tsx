import React from 'react';
import { type t, Color, css, ObjectView } from './common.ts';

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
      <ObjectView
        name={'T:SampleDoc'}
        data={props.doc}
        expand={1}
        fontSize={24}
        theme={theme.name}
      />
    </div>
  );
};
