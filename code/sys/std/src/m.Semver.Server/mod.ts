/**
 * @module
 * Tools for working with semantic-versions (server edition).
 * https://semver.org
 */
import type { SemverServerLib } from './t.ts';

import { Base } from './common.ts';
import { Fmt } from './m.Fmt.ts';

export const Semver: SemverServerLib = {
  ...Base,
  Fmt,
};
