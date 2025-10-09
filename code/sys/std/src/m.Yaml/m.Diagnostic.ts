import type { t } from './common.ts';
import { fromYamlError, fromYamlErrors } from './u.diag.from.ts';

export const Diagnostic: t.YamlDiagnosticLib = {
  fromYamlError,
  fromYamlErrors,
};

/**
 * Helpers:
 */
type R = readonly [number, number] | readonly [number, number, number?];
function coerceRange(r: R): t.Yaml.Range {
  return typeof r[2] === 'number'
    ? ([r[0], r[1], r[2] as number] as const)
    : ([r[0], r[1]] as const);
}
