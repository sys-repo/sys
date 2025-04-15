import { useState } from 'react';
import { type t, Signal, Timestamp } from './common.ts';

export const useTimestamps: t.UseTimestamps = (props, player) => {
  const [column, setColumn] = useState<t.ReactNode>();
  const [pulldown, setPulldown] = useState<t.ReactNode>();

  Signal.useEffect(() => {
    if (!player || !props.content?.timestamps) return;

    const timestamps = props.content.timestamps;
    const secs = player.props.currentTime.value;
    const match = Timestamp.find(timestamps, secs, { unit: 'secs' });

    const renderer = wrangle.renderer(match?.data);
    setColumn(renderer.column?.(props));
    setPulldown(renderer.pulldown?.(props));
  });

  return {
    column,
    pulldown,
  };
};

/**
 * Helpers
 */
const wrangle = {
  renderer(data?: t.ContentTimestamp): t.ContentTimestampProps {
    if (!data) return {};
    if (typeof data === 'function') return { column: data };
    return data;
  },
} as const;
