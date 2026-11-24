import { D, Is, Num, Obj, type t } from '../common.ts';
import type { HandlerSnapshot } from './t.ts';
import { failure } from './u.ts';

const RESERVED_HEADERS = new Set([
  'cookie',
  'cookie2',
  'host',
  'content-length',
  'transfer-encoding',
  'connection',
  'origin',
  'referer',
]);

/** Validate and capture finite client authority without retaining caller options. */
export function clientOptions(input: t.HttpCmd.ClientOptions) {
  try {
    keys(input, ['url', 'ns', 'fetch', 'policy', 'headers']);
    const { url, ns, fetch: fetcher, headers, policy } = input;
    if (!Is.str(url) || url !== url.trim() || url.includes('#')) throw undefined;
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
      throw undefined;
    }
    namespace(ns);
    if (fetcher !== undefined && !Is.func(fetcher)) throw undefined;
    return {
      url: parsed.href,
      ns,
      fetch: fetcher ?? globalThis.fetch,
      policy: policyOptions(policy),
      headers: readHeaders(headers),
    };
  } catch {
    throw failure('invalid-options');
  }
}

/** Snapshot the mount, namespace, and own callable entries before any await. */
export function handlerOptions<
  N extends string,
  P extends t.Cmd.Payload.Map<N>,
  R extends t.Cmd.Result.Map<N>,
  E extends t.Cmd.Event.Map<N>,
>(input: t.HttpCmd.HandlerOptions<N, P, R, E>): HandlerSnapshot<N, P, R, E> {
  try {
    keys(input, ['path', 'cmd', 'policy']);
    const { path, cmd, policy } = input;
    if (path !== undefined && !Is.str(path)) throw undefined;
    if (!Is.record(cmd)) throw undefined;
    const { ns, handlers: source } = cmd;
    if (!Is.record(source)) throw undefined;
    namespace(ns);
    const handlers = new Map<string, t.Cmd.Handler.Fn<N, P, R, E>>();
    for (const name of Obj.keys(source)) {
      const value = source[name];
      if (Is.func(value)) handlers.set(name, value);
    }
    return { path, ns, handlers, policy: policyOptions(policy) };
  } catch {
    throw failure('invalid-options');
  }
}

/** Capture only explicitly supported per-call authority. */
export function sendOptions(input: t.HttpCmd.SendOptions = {}) {
  keys(input, ['headers', 'signal']);
  const { headers, signal } = input;
  if (signal !== undefined && !Is.abortSignal(signal)) throw undefined;
  return { headers: readHeaders(headers), signal };
}

/** Build fresh request headers; callers cannot override transport-owned JSON semantics. */
export function requestHeaders(base: Headers, call: Headers): Headers {
  const headers = new Headers(base);
  call.forEach((value, name) => headers.set(name, value));
  headers.set('accept', D.Json.accept);
  headers.set('content-type', D.Json.contentType);
  return headers;
}

function policyOptions(input: t.HttpCmd.Policy): t.HttpCmd.Policy {
  keys(input, ['maxBytes', 'timeout']);
  const { maxBytes, timeout } = input;
  keys(maxBytes, ['request', 'response']);
  const { request, response } = maxBytes;
  for (const value of [request, response, timeout]) {
    if (!Num.Is.safeInt(value) || value <= 0) throw undefined;
  }
  return Obj.deepFreeze({ maxBytes: { request, response }, timeout });
}

function readHeaders(input: HeadersInit | undefined): Headers {
  const headers = new Headers(input);
  headers.forEach((_value, name) => {
    if (RESERVED_HEADERS.has(name)) throw undefined;
  });
  return headers;
}

function namespace(input: unknown): void {
  if (input !== undefined && !Is.str(input)) throw undefined;
}

function keys(input: unknown, allowed: readonly string[]): void {
  if (
    !Is.record(input) ||
    !Reflect.ownKeys(input).every((key) => Is.str(key) && allowed.includes(key))
  ) {
    throw undefined;
  }
}
