import type { t } from '../common';

export const Specs = {
  'sample.MySample': () => import('./-SPEC.MySample'),
  'sample.empty': () => import('./-SPEC.Empty'),
  'sample.fail': () => import('./-SPEC.Fail'),
  'sample.error': () => import('./-SPEC.Error'),
} as t.SpecImports;
