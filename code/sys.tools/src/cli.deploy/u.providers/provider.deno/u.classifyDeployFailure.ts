import { type t } from './common.ts';

const MISSING_APP_MARKERS = [
  'app not found',
  'application not found',
  'project not found',
  'app does not exist',
  'application does not exist',
  'project does not exist',
  'deploy app was not found',
] as const;

export function classifyDeployFailure(
  result: t.DenoDeploy.Deploy.Result,
): { readonly kind: 'missing-app' | 'other' } {
  const text = failureText(result).toLowerCase();
  if (text.length === 0) return { kind: 'other' };

  if (MISSING_APP_MARKERS.some((marker) => text.includes(marker))) {
    return { kind: 'missing-app' };
  }

  return { kind: 'other' };
}

function failureText(result: t.DenoDeploy.Deploy.Result): string {
  if ('error' in result) {
    return result.error instanceof Error ? result.error.message : String(result.error);
  }

  return [result.stderr.trim(), result.stdout.trim()]
    .filter((value) => value.length > 0)
    .join('\n');
}
