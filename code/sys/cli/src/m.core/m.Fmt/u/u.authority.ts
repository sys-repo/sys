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

// Text owns the shared language substrate; ordered service-URL formatting additionally owns Set.
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
 * Whether the shared synchronous formatter substrate still matches its import-time baseline.
 * This integrity monitor cannot authenticate a realm poisoned before import.
 */
export const isPresentationAuthorityReady = authority.isReady;
