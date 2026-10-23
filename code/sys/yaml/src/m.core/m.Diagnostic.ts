import type { t } from './common.ts';
import { fromYamlError, fromYamlErrors, toYamlError, toYamlErrors } from './u/u.diag.ts';

export const Diagnostic: t.YamlDiagnosticLib = Object.freeze({
  fromYamlError,
  fromYamlErrors,
  toYamlError,
  toYamlErrors,
});
