import React from 'react';
import { type t, Color, css } from './common.ts';
import { parseTimes } from './u.ts';
import { Thumbnail } from './ui.Thumbnail.tsx';

export type ThumbnailsProps = {
  timestamps?: t.VideoTimestamps;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export const Thumbnails: React.FC<ThumbnailsProps> = (props) => {
  const { timestamps = {} } = props;
  const times = parseTimes(timestamps);

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'flex',
      alignContent: 'flex-start',
      flexWrap: 'wrap',
      gap: '8px',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {times.map((item, i) => (
        <Thumbnail
          key={`${i}.${item.timestamp}`}
          item={item}
          onClick={(e) => {
            console.log('🐷 thumbnail click', e);
          }}
        />
      ))}
    </div>
  );
};
