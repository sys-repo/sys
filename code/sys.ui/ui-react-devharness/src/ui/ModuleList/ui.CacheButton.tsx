import React from 'react';
import { type t, Color, css } from './common.ts';
import { useCacheButton } from './use.CacheButton.ts';

export type CacheButtonProps = {
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const CacheButton: React.FC<CacheButtonProps> = (props) => {
  const button = useCacheButton();

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      background: 'none',
      color: button.isOver ? Color.alpha(Color.BLUE, 1) : Color.alpha(theme.fg, 0.3),
      border: 'none',
      borderRadius: 3,
      padding: '2px 6px',
      userSelect: 'none',
      cursor: button.isBusy ? 'default' : 'pointer',
      opacity: button.isBusy ? 0.6 : 1,

      fontFamily: 'monospace',
      fontWeight: 600,
      fontSize: 11,
      letterSpacing: -0.2,

      display: 'inline-grid',
      transform: `translateY(${button.isDown ? 1 : 0}px)`,
      transition: 'transform 40ms linear',
    }),
  };

  return (
    <button
      type={'button'}
      className={css(styles.base, props.style).class}
      disabled={button.isBusy}
      title={button.label}
      {...button.handlers}
    >
      {button.label}
    </button>
  );
};
