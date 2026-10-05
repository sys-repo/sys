import { Is, type t, toHeaders } from '../common.ts';

type RequestHeadersArgs = {
  readonly contentType: t.StringContentType;
  readonly contentTypePolicy: t.HttpFetch.CreateOptions['contentTypePolicy'];
  readonly init: t.HttpFetch.Init;
  readonly defaults: () => Headers;
};

/** Snapshot canonical default Fetch headers. */
export const defaultHeaders: t.HttpFetch.DefaultHeaders.Method = (options) => {
  const accessTokenInput = options.accessToken;
  const mutate = options.headers;
  const headers = new Headers();
  const accessToken = toAccessToken(accessTokenInput);
  if (accessToken) headers.set('authorization', accessToken);

  if (Is.func(mutate)) {
    const payload: t.HttpFetch.Mutate.Headers.Args = {
      get headers() {
        return toHeaders(headers);
      },
      get(name) {
        return headers.get(name) ?? undefined;
      },
      set(name, value) {
        const next = Is.str(value) ? value.trim() : value;
        if (Is.falsy(next)) headers.delete(name);
        else headers.set(name, String(next));
        return payload;
      },
    };
    rejectThenable(mutate(payload));
  }

  return headers;
};

/** Snapshot default and caller headers with canonical caller precedence. */
export function requestHeaders(args: RequestHeadersArgs): Headers {
  const headers = new Headers(args.defaults());
  const caller = new Headers(args.init.headers);
  caller.forEach((value, name) => headers.set(name, value));

  if (args.contentType && args.contentTypePolicy === 'always' && !headers.has('content-type')) {
    headers.set('content-type', args.contentType);
  }
  return headers;
}

function toAccessToken(input: t.HttpFetch.CreateOptions['accessToken']): string {
  let value: unknown = input;
  if (Is.func(value)) value = value();
  rejectThenable(value);
  if (value === undefined) return '';
  if (!Is.str(value)) throw new TypeError('Fetch access-token callbacks must return a string');
  const token = value
    .trim()
    .replace(/^Bearer /, '')
    .trim();
  return token ? `Bearer ${token}` : '';
}

function rejectThenable(input: unknown): void {
  if (!Is.promise(input)) return;
  drain(input);
  throw new TypeError('Fetch header callbacks must settle synchronously');
}

function drain(input: PromiseLike<unknown>): void {
  try {
    const wrapped = new Promise<unknown>((resolve) => resolve(input));
    wrapped.catch(() => undefined);
  } catch {
    // A hostile thenable is rejected synchronously.
  }
}
