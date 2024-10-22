import type { t } from './common.ts';
export { Dev } from '../mod.ts';

export const ModuleSpecs = {
  'sys.ui.dev.Harness': () => import('../ui/Harness/-SPEC.tsx'),
  'sys.ui.dev.ModuleList': () => import('../ui/ModuleList/-SPEC.tsx'),
} as t.SpecImports;

export const SampleSpecs = {
  'dev.sample.MySample': () => import('../-test/sample.specs/-SPEC.MySample.tsx'),
  'dev.sample.DevTools': () => import('../-test/sample.DevTools/-SPEC.tsx'),
  'dev.sample.Size': () => import('../-test/sample.specs/-SPEC.Size.tsx'),
  'dev.sample.Empty': () => import('../-test/sample.specs/-SPEC.Empty.tsx'),

  // 'dev.sample.Error': () => import('../-test/sample.specs/-SPEC.Error.tsx'),
  // 'dev.sample.Fail': () => import('../-test/sample.specs/-SPEC.Fail.tsx'),
} as t.SpecImports;

export const Specs = {
  ...ModuleSpecs,
  ...SampleSpecs,
} as t.SpecImports;
