import { useState } from 'react';
import { type t, Signal, Timestamp } from './common.ts';

export const useTimestamps = (props: t.VideoContentProps, player?: t.VideoPlayerSignals) => {
  const [content, setContent] = useState<t.ReactNode>();

  Signal.useEffect(() => {
    if (!player || !props.content?.timestamps) return;
    const timestamps = props.content.timestamps;
    const secs = player.props.currentTime.value;
    const match = Timestamp.find(timestamps, secs, { unit: 'secs' });
    const renderer = wrangle.bodyRenderer(match?.data);
    const el = renderer?.(props);
    setContent(el);
  });

  return { content } as const;
};

/**
 * Helpers
 */
const wrangle = {
  bodyRenderer(data?: t.ContentTimestamp): t.ContentTimestampMap['body'] | undefined {
    if (!data) return;
    if (typeof data === 'function') return data;
    return data.body;
  },
} as const;
