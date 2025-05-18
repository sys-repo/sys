import React from 'react';
import { type t, Color, css, Icons } from './common.ts';

export type ChevronProps = {
  item: t.MenuListItem;
  color: string;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

type P = ChevronProps;

/**
 * Component:
 */
export const Chevron: React.FC<P> = (props) => {
  const { item, color } = props;
  if (item.chevron === false) return null;

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

  const elBody = wrangle.body(props);
  return <div className={css(styles.base, props.style).class}>{elBody}</div>;
};

/**
 * Helpers:
 */
const wrangle = {
  body(props: P) {
    const { item, color } = props;
    const { chevron } = item;
    if (chevron === false) return null;
    if (React.isValidElement(chevron)) return chevron;
    if (typeof chevron === 'function') return chevron();
    return <Icons.Chevron.Right size={26} color={color} />;
  },
} as const;
