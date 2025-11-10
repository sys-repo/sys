/**
 * @module
 * Type surface for the web-worker transport layer of the CRDT repo.
 * Bridges the main thread and background worker via MessagePort,
 * isolating heavy Automerge work from the UI thread while preserving
 * the standard the `Crdt.Repo` interface.
 */
export { CrdtWorker } from './m.Worker.ts';
