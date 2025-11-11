import React from 'react';
import { type t, Timecode } from './common.ts';

/**
 * Hook: presentational virtual timeline resolver.
 * - Pure delegate to Timecode.Composite.toVirtualTimeline.
 * - Always returns an object; use res.is.empty/res.is.valid for quick checks.
 */
export function useVirtualTimeline(spec?: t.TimecodeCompositionSpec): t.TimecodeResolved {
  return React.useMemo(() => Timecode.Composite.toVirtualTimeline(spec), [spec]);
}
