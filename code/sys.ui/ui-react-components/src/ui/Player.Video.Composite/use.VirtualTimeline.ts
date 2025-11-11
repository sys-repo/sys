import React from 'react';
import { type t, Timecode } from './common.ts';

/**
 * Hook: presentational virtual timeline resolver.
 * - Pure delegate to Timecode.Composite.toVirtualTimeline.
 * - Always returns an object; use res.is.empty/res.is.valid for quick checks.
 * - Adds a `rev` counter that increments each time the resolved timeline changes.
 */
export function useVirtualTimeline(
  spec?: t.TimecodeCompositionSpec,
): t.TimecodeResolved & { readonly rev: number } {
  const [rev, setRev] = React.useState(0);
  const prevRef = React.useRef<t.TimecodeResolved | undefined>(undefined);
  const resolved = React.useMemo(() => Timecode.Composite.toVirtualTimeline(spec), [spec]);

  React.useEffect(() => {
    const prev = prevRef.current;
    const changed =
      !prev ||
      prev.total !== resolved.total ||
      prev.segments.length !== resolved.segments.length ||
      prev.is.valid !== resolved.is.valid;
    if (changed) setRev((n) => n + 1);
    prevRef.current = resolved;
  }, [resolved]);

  return { ...resolved, rev };
}
