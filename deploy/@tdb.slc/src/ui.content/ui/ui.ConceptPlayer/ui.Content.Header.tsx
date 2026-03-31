import React from 'react';
import { type t, Color, css } from './common.ts';
import { BackButton } from './ui.Buttons.tsx';

export type BodyHeaderProps = {
  title?: t.ReactNode;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onBackClick?: t.ReactMouseEventHandler;
};

/**
 * Component:
 */
export const BodyHeader: React.FC<BodyHeaderProps> = (props) => {
  const { title = 'Untitled' } = props;

  /**
   * Render:
   */
  const hero = Color.theme('Dark');
  const styles = {
    base: css({
      position: 'relative',
      color: hero.fg,
      backgroundColor: hero.bg,
      display: 'grid',
      userSelect: 'none',
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
      paddingBottom: 6,
    }),
    title: css({ fontSize: 18 }),
    divider: css({
      pointerEvents: 'none',
      backgroundColor: Color.alpha(hero.fg, 0.15),
      Absolute: [null, 0, 0, 0],
      height: 6,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <BackButton theme={hero.name} onClick={props.onBackClick} />
        <div className={styles.title.class}>{title}</div>
        <div className={styles.divider.class} />
      </div>
    </div>
  );
};
