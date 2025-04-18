import { useEffect, useState } from 'react';
import { type t, Time } from './common.ts';
import { Selection } from './m.Selection.ts';

type P = t.LogoCanvasProps;

export function useSelection(props: t.LogoCanvasProps) {
  const animation = Selection.animation(props.selectionAnimation);
  const [selected, setSeleted] = useState<t.CanvasPanel>();

  /**
   * Effect: keep selected state up-to-date.
   */
  useEffect(() => {
    const time = Time.until();

    async function animateSelected(list: t.CanvasPanel[]) {
      if (time.disposed) return;
      for (const value of list) {
        if (time.disposed) break;
        setSeleted(value);
        await time.wait(animation.delay);
      }
      if (animation.loop) animateSelected(list); // ← 🌳 RECURSION.
    }

    if (Array.isArray(props.selected)) {
      animateSelected(props.selected);
    } else {
      setSeleted(props.selected);
    }

    return time.dispose;
  }, [
    // Deps:
    Selection.selected(props.selected).join(':'),
    animation.delay,
    animation.loop,
  ]);

  /**
   * API:
   */
  return { selected } as const;
}
