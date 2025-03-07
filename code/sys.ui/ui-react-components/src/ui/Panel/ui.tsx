import React from 'react';
import { type t, Color, css } from './common.ts';

export const Panel: React.FC<t.PanelProps> = (props) => {
  const {} = props;

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      color: theme.fg,
      padding: 10,
      borderRadius: 5,
      marginTop: 20,
      fontSize: 14,
    }),
    ul: css({
      marginLeft: 20,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>
        {`🐷 `}
        <b>Panel</b>
      </div>
      <ul className={styles.ul.class}>
        <li>Extensions</li>
        <li>Progress</li>
        <li>Buy Now (Koha)</li>
        <li>etc...</li>
      </ul>
    </div>
  );
};
