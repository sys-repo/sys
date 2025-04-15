import React, { useState } from 'react';
import { type t, Button, Color, css } from './common.ts';

type MouseHandler = React.MouseEventHandler;

export type RoundedButtonProps = {
  label?: string;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onClick?: MouseHandler;
};

/**
 * Component:
 */
export const RoundedButton: React.FC<RoundedButtonProps> = (props) => {
  const { label = 'Unnamed' } = props;
  const [isOver, setOver] = useState(false);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg }),
    body: css({
      minWidth: 70,
      backgroundColor: Color.alpha(theme.fg, isOver ? 1 : 0.15),
      Padding: [12, 25],
      borderRadius: 40,
      border: `solid 1px ${Color.alpha(theme.fg, 0.8)}`,
      display: 'grid',
      placeItems: 'center',
    }),
  };

  return (
    <Button theme={theme.name} onClick={props.onClick} onMouse={(e) => setOver(e.isOver)}>
      <div className={styles.body.class}>{label}</div>
    </Button>
  );
};
