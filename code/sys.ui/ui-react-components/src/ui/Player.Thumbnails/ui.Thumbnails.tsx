import React from 'react';

import { type t, Color, css } from './common.ts';
import { parseTimes } from './u.ts';
import { Thumbnail } from './ui.Thumbnail.tsx';

type P = t.ThumbnailsProps;
export const Thumbnails: React.FC<P> = (props) => {
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
      {times.map(({ timestamp, data }, i) => (
        <Thumbnail
          key={`${i}.${timestamp}`}
          data={data}
          timestamp={timestamp}
          timestamps={timestamps}
          onClick={(e) => props.onTimestampClick?.(e)}
          videoSignals={props.videoSignals}
        />
      ))}
    </div>
  );
};
