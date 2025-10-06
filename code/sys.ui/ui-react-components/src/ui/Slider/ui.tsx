import { useEffect } from 'react';
import { type t, Color, DEFAULTS, css, useRev } from './common.ts';

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
   * Hooks:
   */
  const monitor = useEventMonitor({ enabled, onChange });
  const [, redraw] = useRev();
  useEffect(redraw, [!!monitor.el]); // NB: ensure the thumb renders (which is waiting for the [ref] → totalWidth).

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const totalWidth = monitor.el?.offsetWidth ?? -1;
  const width = props.width;
  const maxTrackHeight = Math.max(...tracks.map((item) => item.height));
  const height = Math.max(thumb.size, maxTrackHeight);

  const styles = {
    base: css({
      position: 'relative',
      width,
      height,
      color: theme.fg,
      filter: `grayscale(${enabled ? 0 : 100}%)`,
      opacity: enabled ? 1 : 0.6,
      transition: 'filter 0.2s, opacity 0.2s',
      display: 'grid',
    }),
  };

  const elTracks = tracks.map((track, i) => {
    return (
      <Track
        key={i}
        index={i}
        totalWidth={totalWidth}
        percent={percent}
        track={track}
        thumb={thumb}
        enabled={enabled}
        theme={theme.name}
        background={props.background}
      />
    );
  });

  const elTicks = <Ticks ticks={ticks} theme={theme.name} />;

  const elThumb = totalWidth > -1 && (
    <Thumb
      totalWidth={totalWidth}
      percent={percent}
      height={height}
      thumb={thumb}
      enabled={enabled}
      pressed={monitor.pressed}
      theme={theme.name}
    />
  );

  return (
    <div ref={monitor.ref} className={css(styles.base, props.style).class} {...monitor.handlers}>
      {elTracks}
      {elTicks}
      {elThumb}
    </div>
  );
};
