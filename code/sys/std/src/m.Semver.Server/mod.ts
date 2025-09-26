/**
 * Tools for working with semantic-versions (server edition).
 * https://semver.org
 * @module
 */
import { type t, Base } from './common.ts';
import { Fmt } from './m.Fmt.ts';

/**
 * Tools for working with Semver ("Semantic Versions").
 */
export const Semver: t.SemverServerLib = {
  ...Base,
  Fmt,
};
