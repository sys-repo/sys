import React from 'react';
import { type t, Color, css, D, Icons } from './common.ts';

type LeafNode = { label: string };

export const IndexTree: React.FC<t.IndexTreeProps> = (props) => {
  const { debug = false, minWidth = D.minWidth } = props;

  let items: LeafNode[] = [];


  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
    }),
    body: css({ minWidth }),
    item: css({
      padding: 15,
      borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.15)}`,
      ':last-child': { borderBottom: 'none' },

      display: 'grid',
      gridTemplateColumns: '1fr auto',
    }),
  };

  const elBody = (
    <div className={styles.body.class}>
      {items.map((item, i) => {
        const key = `${i}.${item.label}`;
        return (
          <div key={key} className={styles.item.class}>
            <div>{item.label}</div>
            <Icons.Chevron.Right />
          </div>
        );
      })}
    </div>
  );

  return <div className={css(styles.base, props.style).class}>{elBody}</div>;
};
