import { isTextPresentationAuthorityReady as isTextReady } from '../../m.Fmt.Text/u/u.authority.ts';
import {
  type AuthoritySnapshot,
  createSynchronousAuthority,
  snapshotProperty,
  snapshotShape,
  snapshotsReady,
} from '../../u/u.authority.ts';

const NativeSet = Set;
const freeze = Object.freeze;

// Text checks the shared built-ins; service URL formatting also needs Set.
const setSnapshots = freeze(
  [
    snapshotProperty(globalThis, 'Set'),
    snapshotShape(NativeSet),
    snapshotShape(NativeSet.prototype),
  ] satisfies readonly AuthoritySnapshot[],
);
const isSetReady = () => snapshotsReady(setSnapshots);
const authority = createSynchronousAuthority(
  'Cli.Fmt presentation authority unavailable.',
  [isTextReady, isSetReady],
);

/**
 * Check whether formatter dependencies still match their state at import.
 * The initial state is trusted, not verified.
 */
export const isPresentationAuthorityReady = authority.isReady;

/** Throw if monitored formatter dependencies have changed since import. */
export const assertPresentationAuthority = authority.assert;

/** Check formatter dependencies before and after a synchronous read or callback. */
export const runPresentationAuthority = authority.run;
