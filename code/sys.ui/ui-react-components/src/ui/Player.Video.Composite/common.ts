import { pkg, Pkg } from '../common.ts';

/**
 * Libs:
 */
export { useVirtualPlayback, useVirtualTimeline } from '@sys/ui-react/use';

export * from '../common.ts';
export { KeyValue } from '../KeyValue/mod.ts';
export { ObjectView } from '../ObjectView/mod.ts';
export { VideoElement } from '../Player.Video.Element/mod.ts';
export { RectGrid } from '../Layout.RectGrid/mod.ts';

/**
 * Constants:
 */
const name = 'CompositeVideo';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
