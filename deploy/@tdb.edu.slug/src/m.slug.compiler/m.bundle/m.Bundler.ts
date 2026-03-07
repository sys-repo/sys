import { type t } from './common.ts';
import { run } from './u.run.ts';
import { validate } from './u.validate.ts';

export const Bundler: t.SlugBundleLib = {
  run,
  validate,
} as const;
