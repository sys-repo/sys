import React from 'react';
import { type t, Color, css, Icons } from './common.ts';

export type ChevronProps = {
  item: t.MenuListItem;
  color: string;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Chevron: React.FC<ChevronProps> = (props) => {
  const { color } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Icons.Chevron.Right size={26} color={color} />
    </div>
  );
};
