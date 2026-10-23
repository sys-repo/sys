/**
 * @module
 * Web-worker transport types for the CRDT repo.
 * Bridges the main thread and background worker via MessagePort,
 * isolating heavy Automerge work from the UI thread while preserving
 * the standard `Crdt.Repo` interface.
 */
export { CrdtWorker } from './m.Worker.ts';
