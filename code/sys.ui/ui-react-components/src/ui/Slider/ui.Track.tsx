import React from 'react';
import { Color, css, type t } from './common.ts';
import { Wrangle } from './u.ts';

export type TrackProps = {
  enabled: boolean;
  percent: t.Percent;
  totalWidth: t.Pixels;
  track: t.SliderTrackProps;
  thumb: t.SliderThumbProps;
  style?: t.CssValue;
};

export const Track: React.FC<TrackProps> = (props) => {
  const { totalWidth, thumb, track, enabled } = props;
  const height = track.height;
  const percent = track.percent ?? props.percent;
  const thumbLeft = Wrangle.thumbLeft(percent, totalWidth, thumb.size);
  const progressWidth = percent === 1 ? totalWidth : thumbLeft + thumb.size / 2;

  /**
   * [Render]
   */
  const borderRadius = height / 2;
  const progressRadius = [borderRadius, 0, 0, borderRadius];
  if (percent !== props.percent || thumb.opacity === 0) {
    progressRadius[1] = borderRadius;
    progressRadius[2] = borderRadius;
  }

  const styles = {
    base: css({ Absolute: 0, display: 'grid', alignContent: 'center' }),
    body: css({
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: Color.format(track.color.default),
      borderRadius,
      height,
    }),
    progress: css({
      backgroundColor: Color.format(track.color.highlight),
      borderRadius: progressRadius.map((num) => num + 'px').join(' '),
      height,
      Absolute: [0, null, 0, 0],
      width: progressWidth,
      opacity: percent == 0 ? 0 : enabled ? 1 : 0.3,
      transition: 'opacity 0.2s',
    }),
    border: css({
      Absolute: 0,
      border: `solid 1px ${Color.format(track.color.border)}`,
      borderRadius,
    }),
  };

  return (
    <div {...css(styles.base, props.style)}>
      <div {...styles.body}>
        <div {...styles.progress} />
        {track.color.border !== 0 && <div {...styles.border} />}
      </div>
    </div>
  );
};
