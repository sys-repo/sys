import React from 'react';
import { type t, Bullet, Button, css, D } from './common.ts';

export type ItemProps = {
  index: t.Index;
  selected?: boolean;
  filled?: boolean;
  media: t.VideoMediaContent;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onClick?: t.PlaylistProps['onItemClick'];
};

/**
 * Component:
 */
export const Item: React.FC<ItemProps> = (props) => {
  const { media, index } = props;
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
      <Button onClick={() => props.onClick?.({ item: media, index })}>
        <div>{label}</div>
      </Button>
    </div>
  );
};
