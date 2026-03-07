/**
 * @module
 * Cmd-based web-worker transport layer for the CRDT repo.
 * Replaces the bespoke wire protocol in m.worker with the generic Cmd system.
 *
 * Provides a unified foundation for worker-backed CRDT repos using:
 * - RPC operations via Cmd system
 * - High-frequency events via direct postMessage (hybrid approach)
 */
export { CrdtWorkerCmd } from './m.Cmd.worker.ts';
