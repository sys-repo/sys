/**
 * @module
 * Dispose with opt-in bounded cancellation-container capture for Deno and Node.
 *
 * `Snapshot.until()` copies and freezes admitted array containers (at most 256 nodes and
 * 32 array levels), retaining live leaf identities. It never subscribes or disposes. Invalid
 * input throws `TypeError('Invalid UntilInput')` synchronously without an own `cause`. Structural
 * leaf getters may run; exceptions during capture produce the same fixed error with an own `cause`
 * retaining the thrown value opaquely, including undefined. Consumers own its interpretation.
 *
 * Trap-free proxy rejection uses `node:util.types` through `Is.Native`; host classifier bindings
 * must retain their host-provided identities at initialization. This is a runtime boundary, not
 * filesystem or network authority. The universal Dispose and Rx surfaces remain unchanged.
 */
import { BaseDispose, type t } from './common.ts';
import { Snapshot } from '../m.Snapshot/mod.ts';

/** Frozen extension preserving every universal method by reference. */
export const Dispose: t.Dispose.Server.Lib = Object.freeze({ ...BaseDispose, Snapshot });
