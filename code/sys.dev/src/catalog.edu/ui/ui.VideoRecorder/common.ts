import { type t, Log, pkg, Pkg } from '../common.ts';
import { D as CrdtDefaults } from '../ui.CrdtLayout/mod.ts';

export * from '../common.ts';

/**
 * Libs:
 */
export { Crdt } from '@sys/driver-automerge/web/ui';
export { Media } from '@sys/ui-react-components';
export { CrdtLayout } from '../ui.CrdtLayout/mod.ts';

type P = t.VideoRecorderViewProps;

/**
 * Constants:
 */
const name = 'VideoRecorder:View';
export const logInfo = Log.category(name);

export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  header: CrdtDefaults.header,
  sidebar: CrdtDefaults.sidebar,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.name}` };
