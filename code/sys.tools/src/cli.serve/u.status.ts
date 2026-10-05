import { Err, Str, type t } from './common.ts';

export type StatusInput = {
  readonly target: t.ServeTool.StartTarget;
  readonly context: t.ServeTool.StartServingContext;
  readonly state: t.Service.State;
  readonly error?: t.StdError;
  readonly artifactDetails?: readonly t.Service.Detail[];
};

/** Build a renderer-neutral status snapshot for a running serve target. */
export function statusOf(input: StatusInput): t.Service.Status {
  const { target, context } = input;
  const details = [...statusDetails(target.location.info), ...(input.artifactDetails ?? [])];

  return {
    state: input.state,
    kind: 'static-serve',
    name: target.location.name,
    root: target.location.dir,
    urls: statusUrls(context),
    ...(target.config ? { config: target.config } : {}),
    ...(details.length > 0 ? { details } : {}),
    ...(input.error ? { error: input.error } : {}),
  };
}

/** Convert an unknown lifecycle failure into a structured status error. */
export function statusError(cause: unknown): t.StdError {
  return Err.std(cause);
}

/**
 * Helpers:
 */
function statusUrls(context: t.ServeTool.StartServingContext): readonly t.Service.Url[] {
  const pathUrls = Object.entries(context.location.info ?? {})
    .filter(([, value]) => isPathInfo(value))
    .map(([label, value]) => ({
      label,
      href: statusUrl(context.baseUrl, value),
    }));

  return pathUrls.length > 0 ? pathUrls : [{ href: context.url }];
}

function statusDetails(info: Record<string, string> | undefined): readonly t.Service.Detail[] {
  return Object.entries(info ?? {})
    .filter(([, value]) => !isPathInfo(value))
    .map(([label, value]) => ({ label, value: value.trim() }));
}

function statusUrl(baseUrl: t.StringUrl, path: string): t.StringUrl {
  const suffix = Str.trimLeadingSlashes(path.trim());
  if (!suffix) return `${baseUrl}/` as t.StringUrl;
  return `${baseUrl}/${suffix}` as t.StringUrl;
}

function isPathInfo(value: string) {
  return value.trim().startsWith('/');
}
