import { useState } from 'react';
import { type t, Is, Signal, Timestamp } from './common.ts';

export const useTimestamps: t.UseTimestamps = (player, timestamps) => {
  const [column, setColumn] = useState<t.ReactNode>();
  const [pulldown, setPulldown] = useState<t.ReactNode>();
  const [main, setMain] = useState<t.ReactNode>();

  /**
   * Effect: Render current timestamp.
   */
  Signal.useEffect(() => {
    if (!player || !timestamps) return;

    const secs = player.props.currentTime.value;
    const match = Timestamp.find(timestamps, secs, { unit: 'secs' });
    const renderer = wrangle.renderer(match?.data);

    render(setColumn, renderer.column);
    render(setPulldown, renderer.pulldown);
    render(setMain, renderer.main);
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
async function render(setState: (value: t.ReactNode) => void, renderer?: t.ContentRenderer) {
  if (renderer) {
    const res = renderer();
    setState(Is.promise(res) ? await res : res);
  } else {
    setState(undefined);
  }
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
