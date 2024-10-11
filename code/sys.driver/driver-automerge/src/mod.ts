/**
 * @module
 * Standardised API wrapper around Automerge and Automerge-Repo.
 *
 * @example
 * ```ts
 * import { } from '@sys/driver-automerge';
 * ```
 */
export { Pkg } from './common/mod.ts';

/**
 * Library
 */
export { A, Cmd, Data, Is, toObject } from './common.ts';
export { Store, StoreIndex };

import { Doc, Store, StoreIndex } from './crdt/mod.ts';
// export { StoreIndexDb, WebStore, WebStoreIndex };

  // WebStore,
} as const;

/**
 * Library: UI
// export { Redraw, useDoc, useDocs, useRedrawOnChange } from './ui/ui.use';

/**
 * Dev
// export { SampleCrdt } from './test.ui/SampleCrdt';
