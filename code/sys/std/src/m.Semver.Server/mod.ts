/**
 * @module
 * Tools for working with semantic-versions (server edition).
 * https://semver.org
 */
import type { t } from './common.ts';
import { Base } from './common.ts';
import { Fmt } from './m.Fmt.ts';

export const Semver: t.SemverServerLib = {
  ...Base,
  Fmt,
};
