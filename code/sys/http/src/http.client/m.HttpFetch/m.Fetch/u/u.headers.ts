import { Is, type t, toHeaders } from '../common.ts';

type DefaultHeaderOptions = Pick<t.HttpFetch.CreateOptions, 'accessToken' | 'headers'>;

type RequestHeadersArgs = {
  readonly contentType: t.StringContentType;
  readonly contentTypePolicy: t.HttpFetch.CreateOptions['contentTypePolicy'];
  readonly init: t.HttpFetch.Init;
  readonly defaults: () => Headers;
};

/** Snapshot default Fetch headers. */
export function defaultHeaders(options: DefaultHeaderOptions): Headers {
  const headers = new Headers();
  const accessToken = toAccessToken(options.accessToken);
  if (accessToken) headers.set('authorization', accessToken);

  if (Is.func(options.headers)) {
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
    options.headers(payload);
  }

  return headers;
}

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
  if (Is.func(input)) return input();
  if (!Is.str(input)) return '';
  const token = input
    .trim()
    .replace(/^Bearer /, '')
    .trim();
  return token ? `Bearer ${token}` : '';
}
