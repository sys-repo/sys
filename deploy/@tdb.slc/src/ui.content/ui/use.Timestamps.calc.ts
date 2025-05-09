import { type t, Is, Timestamp } from './common.ts';

export const CalcTimestamp = {
  async render(
    player?: t.VideoPlayerSignals,
    timestamps?: t.ContentTimestamps,
  ): Promise<t.RenderedTimestamp> {
    if (!player || !timestamps) {
      return { column: undefined, pulldown: undefined, main: undefined };
    }

    player.props.src.value;
    const secs = player.props.currentTime.value;
    const match = Timestamp.find(timestamps, secs, { unit: 'secs' });
    const timestamp = match?.data;
    const renderer = wrangle.renderer(timestamp);

    return {
      column: await render(renderer.column),
      pulldown: await render(renderer.pulldown),
      main: await render(renderer.main),
    };
  },
} as const;

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

/**
 * Render the accompanying video content.
 */
async function render(renderer?: t.ContentRenderer) {
  if (!renderer) return;
  const res = renderer();
  if (Is.promise(res)) await res;
  return res;
}
