/**
 * @module
 * Tools for working with semantic-versions (server edition).
 * https://semver.org
 */
import { Base, type t } from './common.ts';
import { Fmt } from './m.Fmt.ts';

/**
 * Tools for working with Semver ("Semantic Versions").
 */
export const Semver: t.Semver.Server.Lib = Object.freeze({
  ...Base,
  Fmt,
});
