import type { t } from './common.ts';
import { fromYamlError, fromYamlErrors, toYamlError, toYamlErrors } from './u.diag.ts';

export const Diagnostic: t.YamlDiagnosticLib = {
  fromYamlError,
  fromYamlErrors,
  toYamlError,
  toYamlErrors,
};
