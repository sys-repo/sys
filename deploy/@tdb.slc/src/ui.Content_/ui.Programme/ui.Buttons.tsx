import React, { useState } from 'react';
import { type t, Button, Color, css, Icons } from './common.ts';

export type SectionButtonProps = {
  label: t.ReactNode;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onClick?: t.ReactMouseEventHandler;
};

/**
 * Component:
 */
export const SectionButton: React.FC<SectionButtonProps> = (props) => {
  const { label = 'Untitled' } = props;
  const [isOver, setOver] = useState(false);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const color = isOver ? Color.BLUE : theme.fg;
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.1)}`,
      ':last-child': { borderBottom: 'none' },
    }),
    body: css({
      Padding: [15, 0],
      display: 'grid',
      gridTemplateColumns: ' 1fr auto',
      alignItems: 'center',
      columnGap: '10px',
    }),
    button: css({ color }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button onMouse={(e) => setOver(e.isOver)} style={styles.button} onClick={props.onClick}>
        <div className={styles.body.class}>
          <div>{label}</div>
          <Icons.Chevron.Right size={26} />
        </div>
      </Button>
    </div>
  );
};
