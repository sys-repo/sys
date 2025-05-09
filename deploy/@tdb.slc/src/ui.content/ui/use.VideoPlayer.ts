import React, { useEffect } from 'react';
import { type t, Is, Player } from './common.ts';

export function useVideoPlayer(media?: t.VideoMediaContent, autoPlay?: boolean) {
  const src = media?.video.src;
  const fadeMask = media?.video.fadeMask;
  const enlargeBy = media?.video.enlargeBy;

  const playerRef = React.useRef(Player.Video.signals());
  const player = playerRef.current;

  /**
   * Effect: Player configuration.
   */
  useEffect(() => {
    const p = player.props;
    p.src.value = src;
    p.fadeMask.value = fadeMask ? { size: fadeMask, direction: 'Top:Down' } : undefined;
    p.scale.value = Is.number(enlargeBy) ? (e) => e.enlargeBy(enlargeBy) : 0;
  }, [src, fadeMask, enlargeBy]);

  /**
   * Effect: play on load
   */
  useEffect(() => {
    if (autoPlay) player?.play();
  }, [player, autoPlay]);

  /**
   * API:
   */
  return player;
}
