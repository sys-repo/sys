import { useEffect } from 'react';
import { DEFAULTS, css, useRedraw, type t } from './common.ts';

import { Wrangle } from './u.ts';
import { Thumb } from './ui.Thumb.tsx';
import { Ticks } from './ui.Ticks.tsx';
import { Track } from './ui.Track.tsx';
import { useEventMonitor } from './use.EventMonitor.ts';

export const Slider: React.FC<t.SliderProps> = (props) => {
  const { enabled = DEFAULTS.enabled, onChange } = props;
  const { tracks, ticks, thumb } = Wrangle.props(props);
  const percent = Wrangle.percent(props.percent);

  /**
   * Hooks
   */
  const monitor = useEventMonitor({ enabled, onChange });
  const totalWidth = monitor.el?.offsetWidth ?? -1;

  const redraw = useRedraw();
  useEffect(redraw, [Boolean(monitor.el)]); // NB: ensure the thumb renders (which is waiting for the [ref] → totalWidth).

  /**
   * [Render]
   */
  const width = props.width;
  const maxTrackHeight = Math.max(...tracks.map((item) => item.height));
  const height = Math.max(thumb.size, maxTrackHeight);

  const styles = {
    base: css({
      position: 'relative',
      width,
      height,
      filter: `grayscale(${enabled ? 0 : 100}%)`,
      opacity: enabled ? 1 : 0.6,
      transition: 'filter 0.2s, opacity 0.2s',
      display: 'grid',
    }),
  };

  const elTracks = tracks.map((track, i) => (
    <Track
      key={i}
      totalWidth={totalWidth}
      percent={percent}
      track={track}
      thumb={thumb}
      enabled={enabled}
    />
  ));

  const elTicks = <Ticks ticks={ticks} />;

  const elThumb = totalWidth > -1 && (
    <Thumb
      totalWidth={totalWidth}
      percent={percent}
      height={height}
      thumb={thumb}
      enabled={enabled}
      pressed={monitor.pressed}
    />
  );

  return (
    <div ref={monitor.ref} {...css(styles.base, props.style)} {...monitor.handlers}>
      {elTracks}
      {elTicks}
      {elThumb}
    </div>
  );
};
