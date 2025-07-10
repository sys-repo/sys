/**
 * Tools for working with semantic-versions (server edition).
 * https://semver.org
 * @module
 */
import type { SemverServerLib } from './t.ts';

import { Base } from './common.ts';
import { Fmt } from './m.Fmt.ts';

export const Semver: SemverServerLib = {
  ...Base,
  Fmt,
};
