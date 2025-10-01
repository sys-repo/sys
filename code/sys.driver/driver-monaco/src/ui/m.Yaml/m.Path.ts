import type { t } from './common.ts';
import { observe } from './u.path.observe.ts';

/**
 * Tools for working with selection paths in YAML.
 */
export const Path: t.EditorYamlPathLib = {
  observe,
};
