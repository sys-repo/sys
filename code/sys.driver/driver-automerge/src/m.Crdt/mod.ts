/**
 * @module
 * Core CRDT primitives.
 */
export { CrdtWorker } from '../m.worker/mod.ts';
export { CrdtIs } from './m.Is.ts';
export { CrdtUrl } from './m.Url.ts';

export { toAutomergeHandle, toRef } from '../m.Crdt.ref/mod.ts';
export { toAutomergeRepo, toRepo } from '../m.Crdt.repo/mod.ts';
export { A, whenReady } from './common.ts';
export { toObject } from './u.toObject.ts';
export { createPeerId } from './u.createPeerId.ts';
