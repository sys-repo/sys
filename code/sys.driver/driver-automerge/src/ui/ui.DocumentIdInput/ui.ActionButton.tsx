import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, DEFAULTS, rx, Button } from './common.ts';

export type ActionButtonProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onClick?: () => void;
};

/**
 * Component:
 */
export const ActionButton: React.FC<ActionButtonProps> = (props) => {
  const {} = props;

  /**
   * Hooks:
   */
  const [isOver, setOver] = useState(false);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
    body: css({
      borderRadius: 4,
      backgroundColor: isOver ? Color.BLUE : undefined,
      color: isOver ? Color.WHITE : Color.BLUE,
      PaddingX: 20,
      margin: 1,
      display: 'grid',
      placeItems: 'center',
    }),
  };

  return (
    <Button
      theme={theme.name}
      style={css(styles.base, props.style)}
      onClick={props.onClick}
      onMouse={(e) => setOver(e.isOver)}
    >
      <div className={styles.body.class}>{'New'}</div>
    </Button>
  );
};
