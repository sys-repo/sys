import React from 'react';
import { type t, Color, css, SheetBase } from './common.ts';

/**
 * Component:
 */
export const Sheet: React.FC<t.SheetProps> = (props) => {
  const { state, is, index, orientation } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({}),
    body: css({ display: 'grid', pointerEvents: 'auto' }),
  };

  return (
    <SheetBase.View
      style={css(styles.base, props.style)}
      theme={theme.name}
      edgeMargin={props.edgeMargin}
      orientation={props.orientation}
    >
      <div className={styles.body.class}>{props.children}</div>
    </SheetBase.View>
  );
};
