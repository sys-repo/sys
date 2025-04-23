import React from 'react';
import { type t, Bullet, css, D } from './common.ts';

export type ItemProps = {
  media: t.VideoMediaContent;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Item: React.FC<ItemProps> = (props) => {
  const { media } = props;
  const label = media.title ?? 'Untitled';
  const bulletSize = D.bulletSize;

  /**
   * Render:
   */
  const styles = {
    base: css({
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      alignItems: 'center',
      columnGap: 10,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Bullet size={bulletSize} theme={props.theme} />
      <div>{label}</div>
    </div>
  );
};
