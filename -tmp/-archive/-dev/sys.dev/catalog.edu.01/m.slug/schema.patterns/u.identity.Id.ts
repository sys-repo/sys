import { type t, V } from './common.ts';

type L = t.SlugPatternLib;

export const ID_PATTERN = '^[a-z0-9][a-z0-9.-]*$';

/**
 * Stable identifier: starts [a-z0-9], allows [a-z0-9.-]
 * Example: "video.player-01"
 */
export const Id: L['Id'] = (o = {}) => {
  return V.string({
    pattern: ID_PATTERN,
    description: `Stable identifier (start: [a-z0-9]; allowed: [a-z0-9.-]).`,
    ...o,
  }) as ReturnType<L['Id']>;
};
