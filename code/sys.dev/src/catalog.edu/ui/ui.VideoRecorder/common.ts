import { type t, Crdt, Log, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Libs:
 */
export { Media, Spinners } from '@sys/ui-react-components';
export { Icons } from '../ui.Icons.ts';

/**
 * Constants:
 */
const name = 'VideoRecorder:View';
export const logInfo = Log.logger(name);
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  aspectRatio: '4/3',
  config: {
    mimeType: 'video/webm;codecs=vp9,opus',
    videoBitsPerSecond: 10_000_000, // 10-Mbps
    audioBitsPerSecond: 128_000, //    128-kbps
  } satisfies Required<t.VideoRecorderConfig>,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
