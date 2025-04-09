import { useState } from 'react';
import { type t, Signal, Timestamp } from '../common.ts';

export const useTimestamps = (props: t.VideoContentProps, player?: t.VideoPlayerSignals) => {
  const [content, setContent] = useState<t.ReactNode>();

  Signal.useEffect(() => {
    if (!player || !props.content?.timestamps) return;
    const timestamps = props.content.timestamps;
    const secs = player.props.currentTime.value;
    const match = Timestamp.find(timestamps, secs, { unit: 'secs' });
    const el = match?.data?.(props);
    setContent(el);
  });

  return { content } as const;
};
