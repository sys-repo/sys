import { useEffect, useState } from 'react';
import { Time } from './common.ts';

type Args = {
  playing: boolean;
  canPlay: boolean;
  pointerOver: boolean;
  hideAfter?: number;
};

export function useControlsVisible(args: Args) {
  const { playing, canPlay, pointerOver, hideAfter = 800 } = args;
  const [visible, setVisible] = useState(true);

  /**
   * Effect:
   */
  useEffect(() => {
    if (pointerOver || !canPlay || !playing) {
      setVisible(true);
      return;
    }

    // Hide after delay:
    const time = Time.until();
    time.delay(hideAfter, () => setVisible(false));
    return time.dispose;
  }, [pointerOver, playing, canPlay, hideAfter]);

  /**
   * API:
   */
  return visible;
}
