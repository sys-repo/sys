import { type t } from './common.ts';
import { polyfill, unpolyfill } from './u.polyfill.ts';

export const init: t.DomMockLib['init'] = (beforeEach, afterEach) => {
  beforeEach(polyfill);
  afterEach(unpolyfill);
};
