import React, { useEffect, useState, useRef, useCallback } from 'react';
import { type t, Signal, rx, CanvasPanelList, Time } from './common.ts';

export function useSelectedPanel() {
  const panel = Signal.useSignal<t.CanvasPanel>('purpose');

  /**
   * Effect: Cycle the selected SLC panel.
   */
  useEffect(() => {
    const delay = 2_000;
    const life = rx.lifecycle();

    const next = async () => {
      if (life.disposed) return;
      Signal.cycle(panel, CanvasPanelList);
      Time.delay(delay, next);
    };

    Time.delay(delay, next);
    return life.dispose;
  }, []);

  /**
   * API
   */
  return panel;
}
