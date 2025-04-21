import React from 'react';
import { type t, Color, css } from './common.ts';
import { BackButton } from './ui.Buttons.tsx';

export type BodyHeaderProps = {
  title?: t.ReactNode;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onBackClick?: t.MouseEventHandler;
};

/**
 * Component:
 */
export const BodyHeader: React.FC<BodyHeaderProps> = (props) => {
  const { title = 'Untitled' } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      borderBottom: `solid 8px ${Color.alpha(theme.fg, 0.05)}`,
      display: 'grid',
    }),
    body: css({
      lineHeight: 0, // NB: prevent descender gap.
      height: 60,
      display: 'grid',
      gridAutoFlow: 'column',
      gridAutoColumns: 'max-content',
      alignItems: 'center',
      justifyContent: 'start',
      columnGap: '10px',
      padding: '0 10px',
    }),
    title: css({ fontSize: 16 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <BackButton theme={theme.name} onClick={props.onBackClick} />
        <div className={styles.title.class}>{title}</div>
      </div>
    </div>
  );
};
