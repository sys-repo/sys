import React from 'react';
import { type t, Color, css, D, KeyValue, Obj } from './common.ts';
import { OriginSelector } from './ui.OriginSelector.tsx';

export const ClientLoader: React.FC<t.DevOriginProps> = (props) => {
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
      <OriginSelector theme={theme.name} />
    </div>
  );
};
