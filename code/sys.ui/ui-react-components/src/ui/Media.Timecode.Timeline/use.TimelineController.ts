import React from 'react';
import type { t } from './common.ts';
import { useTimeline } from './use.Timeline.ts';

/**
 * Media timeline controller:
 * - Resolves beats → concrete media URLs.
 * - Tracks active beat.
 * - Drives the attached video signals.
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
      return { index, beat, url };
    });
  }, [bundle, timeline]);

  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined);

  /**
   * Reset controller when the document changes.
   */
  React.useEffect(() => {
    setActiveIndex(undefined);
    if (video) {
      video.props.src.value = undefined;
    }
  }, [docid, video]);

  const select = React.useCallback(
    (index: number) => {
      const item = beats[index];
      if (!item) return;

      setActiveIndex(index);

      const { url } = item;
      if (url && video) {
        video.props.src.value = url;
      }
    },
    [beats, video],
  );

  const play = select;

  /**
   * Auto-select first beat when a new set of beats arrives.
   */
  React.useEffect(() => {
    if (beats.length > 0 && activeIndex == null) select(0);
  }, [beats, activeIndex, select]);

  return { timeline, beats, activeIndex, select, play };
};
