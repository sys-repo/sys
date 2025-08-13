import React from 'react';
import { type t } from './common.ts';

/** Cache: Dynamically imported components. */
const map = new Map<string, t.LazyViewFactory>();

/**
 * Lazy loader:
 */
export function getLazy(id: string, factory: t.GetView): t.LazyViewFactory {
  if (!map.has(id)) {
    const lazy = React.lazy(() => factory(id));
    map.set(id, lazy);
  }
  return map.get(id)!;
}
