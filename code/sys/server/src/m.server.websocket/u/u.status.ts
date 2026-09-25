import { D, Err, Is, type t } from '../common.ts';

/** Mutable runtime status tracked by the owning server handle. */
export type RuntimeStatus = {
  state: t.Service.State;
  error?: t.StdError;
};

/** Build the renderer-neutral service status snapshot for a running WebSocket server. */
export function serviceStatus(args: {
  readonly options?: t.WebSocketServer.StatusOptions;
  readonly url: t.StringUrl;
  readonly httpUrls?: readonly t.Service.Url[];
  readonly path: t.StringUrlRoute;
  readonly ns?: t.Cmd.Namespace;
  readonly connections: number;
  readonly runtime: RuntimeStatus;
}): t.Service.Status {
  const status = args.options;
  const details = serviceDetails(args);
  const name = status?.name;
  const root = status?.root;
  const config = status?.config;

  return {
    state: args.runtime.state,
    kind: status?.kind ?? D.status.kind,
    urls: [
      { href: args.url, label: status?.urlLabel ?? D.status.urlLabel },
      ...(args.httpUrls ?? []),
    ],
    ...(Is.str(name) && name.length > 0 ? { name } : {}),
    ...(Is.str(root) && root.length > 0 ? { root } : {}),
    ...(Is.str(config) && config.length > 0 ? { config } : {}),
    ...(details.length > 0 ? { details } : {}),
    ...(args.runtime.error ? { error: args.runtime.error } : {}),
  };
}

/** Select the URL used by hosted keyboard/browser-open affordances. */
export function serviceOpenUrl(status: t.Service.Status): t.StringUrl | undefined {
  return status.urls?.find((url) =>
    url.href.startsWith('http://') || url.href.startsWith('https://')
  )
    ?.href ?? status.urls?.[0]?.href;
}

/** Convert an unknown lifecycle failure into the standard service error shape. */
export function serviceError(cause: unknown): t.StdError {
  try {
    return Err.std(cause);
  } catch {
    return { name: 'Error', message: 'WebSocket server shutdown failed' };
  }
}

/**
 * Helpers:
 */
function serviceDetails(args: {
  readonly options?: t.WebSocketServer.StatusOptions;
  readonly path: t.StringUrlRoute;
  readonly ns?: t.Cmd.Namespace;
  readonly connections: number;
}): readonly t.Service.Detail[] {
  const details: t.Service.Detail[] = [
    { label: 'path', value: args.path },
    { label: 'connections', value: String(args.connections) },
  ];

  if (Is.str(args.ns) && args.ns.length > 0) details.push({ label: 'namespace', value: args.ns });
  details.push(...(args.options?.details ?? []));

  return details;
}
