import { D, Is, slug, type t, Time } from '../common.ts';

/** Create a Cmd client error with command metadata. */
export function cmdError(
  kind: t.Cmd.Error.Kind,
  message: string,
  meta: t.Cmd.Error.Meta,
): t.Cmd.Error.Instance {
  const error = new Error(message) as t.DeepMutable<t.Cmd.Error.Instance>;
  error.name = kind;
  error.cmd = meta;
  error.ns = meta.ns;
  return error;
}

/** Create an HTTP Cmd request id. */
export function createId(): t.Cmd.ReqId {
  return `req-${slug()}` as t.Cmd.ReqId;
}

/** Build JSON request headers for the HTTP Cmd client. */
export function requestHeaders(input: HeadersInit | undefined): Headers {
  const headers = new Headers(input);
  if (!headers.has('content-type')) headers.set('content-type', D.Json.contentType);
  if (!headers.has('accept')) headers.set('accept', D.Json.accept);
  return headers;
}

/** Start an optional cancellable client timeout. */
export function startTimeout(
  timeout: t.Msecs | undefined,
  fn: () => void,
): t.Time.Delay.Promise | undefined {
  if (!Is.number(timeout)) return undefined;
  return Time.delay(timeout, fn);
}
