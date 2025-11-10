import React from 'react';
import { type t, Color, css, D, KeyValue } from './common.ts';

export const CompositeVideo: React.FC<t.CompositeVideoProps> = (props) => {
  const { spec, debug = false } = props;


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
          { kind: 'title', v: D.displayName },
          { k: 'message', v: '👋 hello, world!' },
        ]}
      />
    </div>
  );
};
