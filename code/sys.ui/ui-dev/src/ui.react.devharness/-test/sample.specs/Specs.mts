import type { t } from '../common.ts';

export const Specs = {
  'sample.MySample': () => import('./-SPEC.MySample.tsx'),
  'sample.empty': () => import('./-SPEC.Empty.tsx'),
  'sample.fail': () => import('./-SPEC.Fail.tsx'),
  'sample.error': () => import('./-SPEC.Error.tsx'),
} as t.SpecImports;
