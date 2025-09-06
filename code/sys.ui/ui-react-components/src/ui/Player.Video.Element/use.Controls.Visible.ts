import { useEffect, useState } from 'react';
import { Time } from './common.ts';

export function useControlsVisible(args: {
  playing: boolean;
  canPlay: boolean;
  pointerOver: boolean;
  hideAfter?: number;
}) {
  const { playing, canPlay, pointerOver, hideAfter = 600 } = args;
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
