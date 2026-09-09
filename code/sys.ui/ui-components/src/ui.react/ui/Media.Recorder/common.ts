import { Log, pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export { Video } from '../Media.Video/mod.ts';

/**
 * Constants:
 */
const name = 'Media.Recorder';
export const logInfo = Log.logger(name);

export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  mimeType: 'video/webm;codecs=vp9,opus',
  videoBitsPerSecond: 10_000_000, // 10-Mbps
  audioBitsPerSecond: 128_000, //    128-kbps
} as const;
export const D = DEFAULTS;
