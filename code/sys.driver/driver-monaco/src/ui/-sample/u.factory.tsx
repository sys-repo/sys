import React from 'react';
import { type t } from './common.ts';

export type LazyFactory = React.LazyExoticComponent<React.FC<any>>;
export type FactoryResponse = { default: React.FC<any> };

/** Cache: Dynamically imported components. */
const map = new Map<string, LazyFactory>();

/**
 * Lazy loader:
 */
export function getLazy(id: string): LazyFactory {
  if (!map.has(id)) {
    const lazy = React.lazy(() => factory(id));
    map.set(id, lazy);
  }
  return map.get(id)!;
}

/**
 */
import { factory } from '../-sample.factory/u.factory.tsx';
