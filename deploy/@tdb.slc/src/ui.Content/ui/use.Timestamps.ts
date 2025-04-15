import { useState } from 'react';
import { type t, Is, Signal, Timestamp } from './common.ts';

export const useTimestamps: t.UseTimestamps = (props, player) => {
  const [column, setColumn] = useState<t.ReactNode>();
  const [pulldown, setPulldown] = useState<t.ReactNode>();

  Signal.useEffect(() => {
    if (!player || !props.content?.timestamps) return;

    const timestamps = props.content.timestamps;
    const secs = player.props.currentTime.value;
    const match = Timestamp.find(timestamps, secs, { unit: 'secs' });

    const renderer = wrangle.renderer(match?.data);
    render(props, setColumn, renderer.column);
    render(props, setPulldown, renderer.pulldown);
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

async function render(
  props: t.VideoContentProps,
  setState: (value: t.ReactNode) => void,
  renderer?: t.VideoContentRenderer,
) {
  const res = renderer?.(props);
  setState(Is.promise(res) ? await res : res);
}
