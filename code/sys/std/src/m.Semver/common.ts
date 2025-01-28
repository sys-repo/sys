import { type t } from '../common.ts';
export * from '../common.ts';

/**
 * Constants
 */
export const Release: t.SemverReleaseLib = {
  types: ['pre', 'major', 'premajor', 'minor', 'preminor', 'patch', 'prepatch', 'prerelease'],
};
