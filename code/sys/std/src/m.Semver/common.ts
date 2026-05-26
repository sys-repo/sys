import type { Semver } from './t.ts';
export * from '../common.ts';

export { Err } from '../m.Err/mod.ts';

/**
 * Constants
 */
export const Release: Semver.Release.Lib = {
  types: ['pre', 'major', 'premajor', 'minor', 'preminor', 'patch', 'prepatch', 'prerelease'],
};
