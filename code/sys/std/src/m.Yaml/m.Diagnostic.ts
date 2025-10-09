import type { t } from './common.ts';
import { fromYamlError, fromYamlErrors } from './u.diag.from.ts';
import { toYamlError, toYamlErrors } from './u.diag.to.ts';

export const Diagnostic: t.YamlDiagnosticLib = {
  fromYamlError,
  fromYamlErrors,
  toYamlError,
  toYamlErrors,
};
