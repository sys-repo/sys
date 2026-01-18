import React from 'react';
import { type t, Color, css, D, ObjectView } from './common.ts';

/**
 * Minimal stack manager - pure data structure only
 */
export const SlugSheetStack: React.FC<t.SlugSheetStackProps> = (props) => {
  const { debug = false, items } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      padding: 30,
    }),
  };

  const elItems = items.map((item) => {
    return (
      <div key={item.id}>
        <ObjectView name={item.id} data={item} />
      </div>
    );
  });

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      {elItems}
    </div>
  );
};
