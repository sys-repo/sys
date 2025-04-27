import { useState } from 'react';
import { type t, Is, Signal, Timestamp } from './common.ts';

export const useTimestamps: t.UseTimestamps = (player, getContentProps) => {
  const [column, setColumn] = useState<t.ReactNode>();
  const [pulldown, setPulldown] = useState<t.ReactNode>();
  const [main, setMain] = useState<t.ReactNode>();

  /**
   * Effect: Render current timestamp.
   */
  Signal.useEffect(() => {
    if (!player) return;

    const p = getContentProps?.();
    if (!p) {
      console.warn(`useTimestamps: No content-props were returned from the getter.`);
      return;
    }

    const timestamps = p.content.media?.timestamps;
    if (!timestamps) return;

    const secs = player.props.currentTime.value;
    const match = Timestamp.find(timestamps, secs, { unit: 'secs' });
    const renderer = wrangle.renderer(match?.data);

    render(p, setColumn, renderer.column);
    render(p, setPulldown, renderer.pulldown);
    render(p, setMain, renderer.main);
  });

  /**
   * API:
   */
  return {
    column,
    pulldown,
    main,
  };
};

/**
 * Render the accompanying video content.
 */
async function render(
  props: t.VideoContentProps,
  setState: (value: t.ReactNode) => void,
  renderer?: t.VideoContentRenderer,
) {
  const res = renderer?.(props);
  setState(Is.promise(res) ? await res : res);
}

/**
 * Helpers:
 */
const wrangle = {
  renderer(data?: t.ContentTimestamp): t.ContentTimestampProps {
    if (!data) return {};
    if (typeof data === 'function') return { column: data };
    return data;
  },
} as const;
