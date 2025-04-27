import { useState } from 'react';
import { type t, Signal } from './common.ts';
import { CalcTimestamp } from './use.Timestamps.calc.ts';

export { CalcTimestamp };

export const useTimestamps: t.UseTimestamps = (player, timestamps) => {
  const [rendered, setRendered] = useState<t.RenderedTimestamp>();

  /**
   * Effect: Render current timestamp.
   */
  Signal.useEffect(() => {
    player?.props.src.value;
    player?.props.currentTime.value;
    CalcTimestamp.render(player, timestamps).then((m) => setRendered(m));
  });

  /**
   * API:
   */
  return rendered ?? {};
};
