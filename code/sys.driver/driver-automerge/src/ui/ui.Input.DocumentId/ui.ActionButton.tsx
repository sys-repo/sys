import React, { useState } from 'react';
import { type t, Button, Color, css } from './common.ts';

export type ActionButtonProps = {
  action: t.DocumentIdInputAction;
  debug?: boolean;
  theme?: t.CommonTheme;
  enabled?: boolean;
  style?: t.CssInput;
  onClick?: () => void;
};

/**
 * Component:
 */
export const ActionButton: React.FC<ActionButtonProps> = (props) => {
  const { enabled = false, action } = props;

  /**
   * Hooks:
   */
  const [isOver, setOver] = useState(false);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      filter: !enabled ? 'grayscale(100%)' : undefined,
    }),
    body: css({
      borderRadius: 4,
      backgroundColor: isOver && enabled ? Color.BLUE : undefined,
      color: isOver && enabled ? Color.WHITE : Color.BLUE,
      width: 80,
      margin: 1,
      display: 'grid',
      placeItems: 'center',
    }),
  };

  return (
    <Button
      theme={theme.name}
      style={css(styles.base, props.style)}
      enabled={enabled}
      onClick={props.onClick}
      disabledOpacity={0.6}
      onMouse={(e) => setOver(e.isOver)}
    >
      <div className={styles.body.class}>{action}</div>
    </Button>
  );
};
