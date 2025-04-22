import React, { useState } from 'react';
import { type t, Button, Color, css, Icons } from './common.ts';

/**
 * Component: BackButton
 */
export type BackButtonProps = {
  theme?: t.CommonTheme;
  size?: t.Pixels;
  style?: t.CssInput;
  onClick?: t.ReactMouseEventHandler;
};
export const BackButton: React.FC<BackButtonProps> = (props) => {
  const { size = 26 } = props;
  const [isOver, setOver] = useState(false);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = { base: css({}) };
  const color = isOver ? Color.BLUE : theme.fg;

  return (
    <div className={css(styles.base, props.style).class}>
      <Button onClick={props.onClick} onMouse={(e) => setOver(e.isOver)}>
        <Icons.Arrow.Back color={color} size={size} />
      </Button>
    </div>
  );
};
