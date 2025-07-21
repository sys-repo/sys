import React, { useEffect } from 'react';
import { type t, Is, Player, Time } from './common.ts';

export function useVideoPlayer(
  media: t.VideoMediaContent | undefined,
  autoPlay: boolean | undefined,
  muted: boolean | undefined,
) {
  const src = media?.video.src;
  const fadeMask = media?.video.fadeMask;
  const enlargeBy = media?.video.enlargeBy;

  /**
   * Refs:
   */
  const signalsRef = React.useRef(Player.Video.signals());
  const signals = signalsRef.current;

  /**
   * Hooks:
   */
  const controller = Player.Video.useSignals(signals);

  /**
   * Effect: Player configuration.
   */
  useEffect(() => {
    const p = signals.props;
    p.src.value = src;
    p.fadeMask.value = fadeMask ? { size: fadeMask, direction: 'Top:Down' } : undefined;
    p.scale.value = Is.number(enlargeBy) ? (e) => e.enlargeBy(enlargeBy) : 0;
  }, [src, fadeMask, enlargeBy]);

  /**
   * Effect: play on load.
   */
  useEffect(() => {
    const time = Time.until();
    if (autoPlay) time.delay(0, () => signals?.play());
    return time.dispose;
  }, [signals, autoPlay]);

  /**
   * Render:
   */
  type P = { style?: t.CssInput; onEnded?: t.VideoElementProps['onEnded'] };
  function render(props: P = {}) {
    return (
      <Player.Video.View
        {...controller.props}
        style={props?.style}
        muted={muted}
        onEnded={(e) => {
          props?.onEnded?.(e);
          controller.props.onEnded?.(e);
        }}
      />
    );
  }

  /**
   * API:
   */
  return { signals, controller, render } as const;
}
