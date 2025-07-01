import React, { useState } from 'react';
import { type t, Button, Color, css } from './common.ts';

export type ActionButtonProps = {
  action: t.DocumentIdAction;
  parentOver?: boolean;
  parentFocused?: boolean;
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
  const { action, enabled = false, parentOver, parentFocused } = props;

  /**
   * Hooks:
   */
  const [isOver, setOver] = useState(false);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const isButtonSolid = enabled && (isOver || parentFocused);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      filter: !enabled ? 'grayscale(100%)' : undefined,
    }),
    body: css({
      width: 70,
      borderRadius: 4,
      backgroundColor: isButtonSolid ? Color.BLUE : theme.alpha(parentOver ? 0.08 : 0).bg,
      color: isButtonSolid ? Color.WHITE : Color.BLUE,
      transition: `color 80ms ease, background-color 80ms ease`,
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
      onMouse={(e) => setOver(e.is.over)}
    >
      <div className={styles.body.class}>{action}</div>
    </Button>
  );
};
