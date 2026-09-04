/**
 * @module
 * Constrained HTTP responses for caller-admitted file bytes.
 *
 * Callers own path admission, byte acquisition, and integrity verification. This module only
 * projects supplied bytes into a constrained HTTP response.
 */
export { serveFileBytes } from '../m.HttpServer/u/u.serveFileBytes.ts';
export type { FileBytes } from './t.ts';
