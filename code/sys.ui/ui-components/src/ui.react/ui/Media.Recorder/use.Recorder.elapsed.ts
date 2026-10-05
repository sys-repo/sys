import { useCallback, useEffect, useRef, useState } from 'react';
import { type t } from './common.ts';

export function useElapsedTimer() {
  const [elapsed, setElapsed] = useState<t.Msecs>(0);
  const startAtRef = useRef<number | undefined>(undefined);
  const accRef = useRef<t.Msecs>(0);
  const timerRef = useRef<number | undefined>(undefined);

  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  const tick = useCallback(() => {
    if (startAtRef.current == null) return;
    const ms = accRef.current + (nowMs() - startAtRef.current);
    setElapsed(Math.max(0, Math.round(ms)));
  }, []);

  const begin = useCallback(() => {
    startAtRef.current = nowMs();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(tick, 200);
  }, [tick]);

  const end = useCallback((accumulate: boolean) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    if (accumulate && startAtRef.current != null) {
      accRef.current += nowMs() - startAtRef.current;
    }
    startAtRef.current = undefined;
    setElapsed(Math.round(accRef.current));
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    startAtRef.current = undefined;
    accRef.current = 0;
    setElapsed(0);
  }, []);

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { elapsed, begin, end, reset } as const;
}
