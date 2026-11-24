import React from 'react';
import { Is, type t } from './common.ts';
import { selectDefaultDevice } from './u.selectDefault.ts';
export { selectDefaultDevice };

type Source = {
  readonly items: readonly MediaDeviceInfo[];
  readonly prefs?: t.DeviceDefaultPrefs;
  readonly seededIndex?: t.Index;
};
type Selection = { readonly source: Source; readonly index?: t.Index };

/**
 * Keep a positional selection bound to its device across changes to the available list.
 */
export const useDeviceSelection: t.UseDeviceSelection = (items, { prefs, seed } = {}) => {
  const seededIndex = Is.num(seed) ? seed : indexOf(items, seed?.deviceId);
  const source = React.useMemo(() => ({ items, prefs, seededIndex }), [items, prefs, seededIndex]);

  // React owns the list and its index together. A retained dispatch never consults a DOM effect.
  const [selection, dispatch] = React.useReducer(
    (prev: Selection, action: Selection | t.Index | undefined): Selection => {
      if (Is.object(action)) return action;
      if (prev.index === action) return prev;
      // All picks in a batch address the order the caller saw. Rebase once after the batch.
      const basis = samePositions(prev.source, source) ? source : prev.source;
      return { source: basis, index: action };
    },
    source,
    (source) => reconcile(source),
  );

  let current = selection;
  if (source !== selection.source) {
    current = reconcile(source, selection);
    // Adjust this component's state before rendering children. Equivalent inputs need no retry:
    // every position a caller could select already denotes the same device.
    if (current.index !== selection.index || !samePositions(selection.source, source)) {
      dispatch(current);
    }
  }

  const toArgs = React.useCallback((index: t.Index) => {
    const device = items[index];
    return device ? { device, index } : undefined;
  }, [items]);
  return { selected: current.index, setSelected: dispatch, toArgs };
};

/**
 * Helpers:
 */
function reconcile(source: Source, previous?: Selection): Selection {
  const { items, prefs, seededIndex } = source;
  if (!items.length) return { source };
  const id = Is.nil(previous?.index) ? undefined : previous.source.items[previous.index]?.deviceId;
  const index = seededIndex ?? indexOf(items, id || undefined) ?? selectDefaultDevice(items, prefs);
  return { source, index };
}

function indexOf(items: readonly MediaDeviceInfo[], id?: string): t.Index | undefined {
  if (Is.nil(id)) return;
  const index = items.findIndex((item) => item.deviceId === id);
  return index >= 0 ? index : undefined;
}

function samePositions(a: Source, b: Source) {
  if (a.seededIndex !== b.seededIndex) return false;
  if (a.items === b.items) return true;
  return a.items.length === b.items.length &&
    a.items.every((item, index) => item.deviceId === b.items[index].deviceId);
}
