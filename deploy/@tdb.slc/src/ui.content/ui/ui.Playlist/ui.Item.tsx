import React from 'react';
import { type t, Bullet, css, D } from './common.ts';

export type ItemProps = {
  selected?: boolean;
  filled?: boolean;
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
      columnGap: 12,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Bullet
        size={bulletSize}
        selected={props.selected}
        filled={props.filled}
        theme={props.theme}
      />
      <div>{label}</div>
    </div>
  );
};
