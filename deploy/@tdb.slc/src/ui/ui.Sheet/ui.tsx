import React from 'react';
import { type t, css, SheetBase } from './common.ts';

/**
 * Component:
 */
export const Sheet: React.FC<t.SheetProps> = (props) => {
  /**
   * Render:
   */
  const styles = {
    body: css({ display: 'grid', pointerEvents: 'auto' }),
  };

  const inherit = { ...props };
  delete inherit.children;

  return (
    <SheetBase.View {...inherit} style={props.style}>
      <div className={styles.body.class}>{props.children}</div>
    </SheetBase.View>
  );
};
