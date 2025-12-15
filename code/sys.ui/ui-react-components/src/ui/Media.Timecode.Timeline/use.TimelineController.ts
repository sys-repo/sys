import React from 'react';

import type { t } from './common.ts';
import { useTimeline } from './use.Timeline.ts';
import { Playback } from '../Media.Timecode.Playback/mod.ts';

/**
 * Media timeline controller:
 * - Resolves beats → concrete media URLs.
 * - Tracks active beat.
 * - Drives the attached video signals via the Playback runner.
 */
export const useTimelineController = <P = unknown>(
  args: t.UseMediaTimelineControllerArgs<P>,
): t.UseMediaTimelineControllerResult<P> => {
  const { bundle, video } = args;
  const docid = bundle?.docid;

  const timelineState = useTimeline<P>(bundle?.spec);
  const timeline = timelineState?.timeline;

  const beats = React.useMemo(() => {
    if (!bundle || !timeline) return [];
    return timeline.beats.map((beat, index) => {
      const logicalPath = beat.src.ref;
      const url = bundle.resolveMedia({ kind: 'video', logicalPath });
      return { index, beat, url } as const;
    });
  }, [bundle, timeline]);

  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined);

  type DeckId = 'A' | 'B';

  const getDeck = React.useCallback(
    (deck: DeckId) => {
      return deck === 'A' ? video?.A : video?.B;
    },
    [video],
  );

  const setSrcAll = React.useCallback(
    (src: t.StringUrl | undefined) => {
      if (!video) return;
      video.A.props.src.value = src;
      video.B.props.src.value = src;
    },
    [video],
  );

  /**
   * Minimal runtime adapter backed by VideoPlayerSignals.
   * Note: we route by deck now.
   */
  const runtime = React.useMemo<t.PlaybackRuntime>(() => {
    const secsFromVTime = (vTime: t.Msecs): t.Secs => (vTime / 1000) as t.Secs;
    return {
      deck: {
        play: (deck) => getDeck(deck as DeckId)?.play(),
        pause: (deck) => getDeck(deck as DeckId)?.pause(),
        seek: (deck, vTime) =>
          getDeck(deck as DeckId)?.jumpTo(secsFromVTime(vTime), { play: false }),
      },
    };
  }, [getDeck]);

  const playback = Playback.useRunner({ runtime });

  /**
   * IMPORTANT:
   * - `Playback.useRunner(...)` returns a new object each render.
   * - `send` is stable and safe to depend on.
   */
  const playbackSend = playback.send;

  /**
   * Build the ui-state Timeline model expected by the playback machine.
   *
   * Duration is derived deterministically:
   * - beat.duration = next.vTime - curr.vTime
   * - last.duration = timeline.duration - last.vTime
   */
  const playbackTimeline = React.useMemo<t.TimecodeState.Playback.Timeline | undefined>(() => {
    if (!timeline) return undefined;

    const mediaLabelOf = (logicalPath: string) => logicalPath.split('/').pop() || logicalPath;

    const rows = beats.map((item, index) => {
      const beat = item.beat;
      const logicalPath = beat.src.ref;
      const mediaLabel = mediaLabelOf(logicalPath);

      const next = beats[index + 1]?.beat;
      const duration =
        next !== undefined ? next.vTime - beat.vTime : timeline.duration - beat.vTime;

      return {
        index: item.index as t.TimecodeState.Playback.BeatIndex,
        vTime: beat.vTime,
        duration,
        pause: beat.pause,
        segmentId: mediaLabel,
        media: { url: item.url, label: mediaLabel },
      } as const;
    });

    // Segment ranges [from,to) by contiguous segmentId.
    const segments: t.TimecodeState.Playback.Segment[] = [];
    let currId: t.StringId | undefined;
    let currFrom = 0;

    for (let i = 0; i < rows.length; i++) {
      const id = rows[i].segmentId;
      if (currId === undefined) {
        currId = id;
        currFrom = i;
        continue;
      }
      if (id !== currId) {
        segments.push({ id: currId, beat: { from: currFrom, to: i } });
        currId = id;
        currFrom = i;
      }
    }

    if (currId !== undefined) {
      segments.push({ id: currId, beat: { from: currFrom, to: rows.length } });
    }

    return {
      beats: rows,
      segments,
      virtualDuration: timeline.duration,
    };
  }, [beats, timeline]);

  /**
   * Attach/reset the playback machine when the doc/timeline changes.
   */
  React.useEffect(() => {
    if (!playbackTimeline) return;

    playbackSend({
      kind: 'playback:init',
      timeline: playbackTimeline,
      startBeat: 0,
    });

    // Keep existing behavior: clear player src on doc change.
    setSrcAll(undefined);

    setActiveIndex(undefined);
  }, [docid, playbackTimeline, playbackSend, setSrcAll]);

  const select = React.useCallback(
    (index: t.Index) => {
      const item = beats[index];
      if (!item) return;

      setActiveIndex(index);
      if (item.url) setSrcAll(item.url);

      playbackSend({ kind: 'playback:seek:beat', beat: index });
      playbackSend({ kind: 'playback:pause' });
    },
    [beats, playbackSend, setSrcAll],
  );

  const play = React.useCallback(
    (index: t.Index) => {
      const item = beats[index];
      if (!item) return;

      setActiveIndex(index);
      if (item.url) setSrcAll(item.url);

      playbackSend({ kind: 'playback:seek:beat', beat: index });
      playbackSend({ kind: 'playback:play' });
    },
    [beats, playbackSend, setSrcAll],
  );

  /**
   * Auto-select first beat when a new set of beats arrives.
   */
  React.useEffect(() => {
    if (beats.length > 0 && activeIndex == null) select(0);
  }, [beats, activeIndex, select]);

  return { timeline, beats, activeIndex, select, play };
};
