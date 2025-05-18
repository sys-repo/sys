import { useState } from 'react';
import { type t, Signal } from './common.ts';
import { Calc, toPlaylist } from './u.ts';

export function useTimestamp(props: { state: t.ProgrammeSignals; player: t.VideoPlayerSignals }) {
  const { state, player } = props;
  const [current, setCurrent] = useState<t.RenderedTimestamp>();

  /**
   * Effect: calculate current timestamp content.
   */
  Signal.useEffect(() => {
    const index = Calc.Section.index(state);
    const media = Calc.Section.media(state);
    const playlist = toPlaylist(media.section);
    const current = playlist[index.child];
    Calc.Timestamp.render(player, current?.timestamps).then((e) => setCurrent(e));
  });

  /**
   * API:
   */
  return { current } as const;
}
