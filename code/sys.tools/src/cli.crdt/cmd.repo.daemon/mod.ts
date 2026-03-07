/**
 * @module
 * Daemon for CRDT repos.
 *
 * Runs a long-lived local process that hosts a CRDT repo and exposes a
 * typed Cmd control plane over WebSocket, bridging browser clients,
 * local filesystem persistence, and upstream sync servers.
 */
export { RepoProcess } from './m.RepoProcess.ts';
