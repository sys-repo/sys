import React from 'react';
import { type t, Color, css, D } from './common.ts';

import { ObjectView } from '../ObjectView/mod.ts';

export const PropsGrid: React.FC<t.PropsGridProps> = (props) => {
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
      <div>{`🐷`}</div>
      <ObjectView name={'data.rows'} data={props.data} expand={5} theme={theme.name} />
    </div>
  );
};
