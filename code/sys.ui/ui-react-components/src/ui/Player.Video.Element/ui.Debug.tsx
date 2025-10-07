import React from 'react';
import { type t, Button, Color, css, Icons } from './common.ts';

export type DebugProps = {
  readyState?: t.NumberMediaReadyState;
  playing?: boolean;
  seeking?: boolean;
  src?: string;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { readyState, playing, seeking } = props;
  const [isOver, setOver] = React.useState(false);

  let src = props.src ?? '';
  src = src ? src?.slice(-10) : '';
  src = `“...${src}”`;

  let text = '';
  text += `ready-state=${readyState}, `;
  text += `playing=${playing}, `;
  text += `seeking=${seeking}, `;
  text += `src=${src} `;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      fontSize: 11,
      color: Color.DARK,
      backgroundColor: Color.alpha(Color.WHITE, 0.5),
      backdropFilter: 'blur(1.5px)',
      Padding: [1, 5],
      borderRadius: 2,
      userSelect: 'none',
    }),
    body: css({
      display: 'grid',
      placeItems: 'center',
      gridAutoFlow: 'column',
      gridAutoColumns: 'auto',
      columnGap: 6,
    }),
    copyIcon: css({
      opacity: isOver ? 1 : 0,
      transition: 'opacity 120ms ease',
    }),
  };

  const handleClick = async () => {
    try {
      text = props.src ?? '';
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Clipboard write failed:', error);
      return false;
    }
  };

  const elBody = (
    <div className={styles.body.class}>
      {text}
      {<Icons.Copy.Basic size={13} style={styles.copyIcon} />}
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <Button onClick={handleClick} onMouse={(e) => setOver(e.is.over)}>
        {elBody}
      </Button>
    </div>
  );
};
