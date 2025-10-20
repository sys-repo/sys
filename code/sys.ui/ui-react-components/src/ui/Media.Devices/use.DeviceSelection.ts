import React from 'react';

import type { t } from './common.ts';
import { selectDefaultDevice } from './u.selectDefault.ts';
export { selectDefaultDevice };

/**
 * useDeviceSelection
 * - Seeds from `seed` (index or MediaDeviceInfo) synchronously.
 * - Preserves selection by `deviceId` across list churn.
 * - Falls back to a derived default when the prior device disappears.
 * - No side-effects beyond React state (persistence handled elsewhere).
 */
export const useDeviceSelection: t.UseDeviceSelection = (items, options = {}) => {
  const { prefs, seed } = options;

  /** Resolve a seed → index (if applicable). */
  const seededIndex = React.useMemo<t.Index | undefined>(() => {
    if (typeof seed === 'number') return seed as t.Index;
    if (seed && 'deviceId' in seed) {
      const idx = items.findIndex((d) => d.deviceId === seed.deviceId);
      return idx >= 0 ? (idx as t.Index) : undefined;
    }
    return undefined;
  }, [items, seed]);

  /** Initial selection prefers seed synchronously, then default. */
  const [selected, setSelected] = React.useState<t.Index | undefined>(() => {
    if (typeof seed === 'number') return seed as t.Index;
    if (seed && 'deviceId' in seed) {
      const idx = items.findIndex((d) => d.deviceId === seed.deviceId);
      if (idx >= 0) return idx as t.Index;
    }
    return selectDefaultDevice(items, prefs);
  });

  /** Track current deviceId to preserve across reorders. */
  const selectedIdRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    selectedIdRef.current = selected !== undefined ? items[selected]?.deviceId : undefined;
  }, [items, selected]);

  /**
   * External changes:
   * - If a seed resolves to a different index, adopt it.
   * - Else try to preserve by deviceId.
   * - Else fall back to a new default (only when no seed applies).
   */
  React.useEffect(() => {
    if (items.length === 0) {
      if (selected !== undefined) setSelected(undefined);
      return;
    }

    if (seededIndex !== undefined && seededIndex !== selected) {
      setSelected(seededIndex);
      return;
    }

    const prevId = selectedIdRef.current;
    if (prevId) {
      const idx = items.findIndex((d) => d.deviceId === prevId);
      if (idx >= 0 && idx !== selected) {
        setSelected(idx as t.Index);
        return;
      }
    }

    if (seededIndex === undefined) {
      const fallback = selectDefaultDevice(items, prefs);
      if (fallback !== selected) setSelected(fallback);
    }
  }, [items, prefs, seededIndex]);

  /** Map index → DeviceHandlerArgs. */
  const toArgs = React.useCallback(
    (index: t.Index): t.DeviceHandlerArgs | undefined => {
      const device = items[index];
      return device ? { device, index } : undefined;
    },
    [items],
  );

  /**
   * API:
   */
  return { selected, setSelected, toArgs };
};
