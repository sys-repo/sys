import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

type P = t.VideoRecorderViewProps;

/**
 * Libs:
 */
export { Crdt } from '@sys/driver-automerge/web/ui';
export { Media } from '@sys/ui-react-components';

/**
 * Constants:
 */
const name = 'VideoRecorder:View';
const documentId: t.VideoRecorderViewDocumentIdProps = { visible: true, readOnly: false };

export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  documentId,
  configVisible: true satisfies P['configVisible'],
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.name}` };
