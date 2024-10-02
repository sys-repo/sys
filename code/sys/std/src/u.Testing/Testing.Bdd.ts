import { describe, it } from '@std/testing/bdd';
import { expect } from 'chai';

import type { t } from '../common.ts';

export { describe, expect, it };

export const Bdd: t.BddLib = {
  describe,
  expect,
  it,
};
