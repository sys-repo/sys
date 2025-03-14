import React from 'react';
import { type t, isRecord, rx } from './common.ts';

type TEventData = {
  seconds: number;
  percent: number;
  duration: number;
};

/**
 * Hook: event management for a <VideoPlayer>.
 */
export function usePlayerEvents(until$?: t.UntilObservable): t.UseVideoPlayerEvents {
  type R = t.UseVideoPlayerEvents;
  const life = rx.disposable(until$);
  const $$ = rx.subject<t.VideoPlayerEvent>();
  const $ = $$.pipe(rx.takeUntil(life.dispose$));

  const handlers: R['handlers'] = {
    onPlay(e) {
      const data = wrangle.data<TEventData>(e.triggers.chain);
      if (data) $$.next({ type: 'Video/play', payload: wrangle.stats(data) });
    },
    onPlaying(e) {
      const data = wrangle.data<TEventData>(e.triggers.chain);
      if (data) $$.next({ type: 'Video/playing', payload: wrangle.stats(data) });
    },
    onPause(e) {
      const data = wrangle.data<TEventData>(e.triggers.chain);
      if (data) $$.next({ type: 'Video/pause', payload: wrangle.stats(data) });
    },
  };

  /**
   * API
   */
  const api: R = {
    $,
    play$: rx.payload<t.VideoPlayEvent>($, 'Video/play'),
    playing$: rx.payload<t.VideoPlayingEvent>($, 'Video/playing'),
    pause$: rx.payload<t.VideoPauseEvent>($, 'Video/pause'),
    handlers,
  };
  return api;
}

/**
 * Helpers
 */
const wrangle = {
  data<T>(triggers: Event[]) {
    try {
      const e = triggers.find((e) => e instanceof MessageEvent);
      return typeof e?.data === 'string' ? (JSON.parse(e.data).data as T) : undefined;
    } catch (error) {
      console.warn(`Failed while parsing event data`, error);
      return undefined;
    }
  },

  stats(input: TEventData): t.VideoStats {
    if (!isRecord(input)) return { percent: 0, duration: 0, elapsed: 0 };
    const { seconds: elapsed, percent, duration } = input;
    return { elapsed, percent, duration };
  },
} as const;
