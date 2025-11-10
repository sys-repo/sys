/**
 * @module
 * Web-Worker entry for CRDT Repo adapters.
 * Bridges the main thread and background worker via MessagePort,
 * isolating heavy Automerge work from the UI thread while preserving
 * the standard `Crdt.Repo` interface.
 */
import type { t } from './common.ts';
