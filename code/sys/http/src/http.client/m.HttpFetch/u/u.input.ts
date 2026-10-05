import { Arr, Is, Num, Obj, type t, Url } from '../common.ts';

export type ValidatedPolicy = {
  readonly maxBytes: t.NumberBytes;
  readonly timeout: t.Msecs;
  readonly maxRedirects: number;
  readonly progressInterval: t.Msecs;
  readonly sourceOrigins: ReadonlySet<string>;
  readonly credentialOrigins: ReadonlySet<string>;
};

type PolicyValidation =
  | { readonly ok: true; readonly value: ValidatedPolicy }
  | { readonly ok: false };

const OWNED_INIT_KEYS = [
  'body',
  'credentials',
  'method',
  'redirect',
  'referrer',
  'referrerPolicy',
] as const;

/** Validate and snapshot one finite response policy. */
export function validateResponsePolicy(input: unknown): PolicyValidation {
  try {
    return validate(input);
  } catch {
    return { ok: false };
  }
}

/** Validate that caller init does not claim helper-owned authority. */
export function validateInit(input: unknown): input is t.HttpFetch.Init {
  try {
    if (!Is.record(input)) return false;
    return OWNED_INIT_KEYS.every((key) => !Obj.hasOwn(input, key));
  } catch {
    return false;
  }
}

/** Resolve a supported Fetch input to its URL string. */
export function inputHref(input: unknown): t.StringUrl | undefined {
  try {
    if (Is.str(input)) return input;
    if (input instanceof Request) return input.url;
    if (input instanceof URL) return input.href;
  } catch {
    return;
  }
}

/** Reduce a URL to its path-safe diagnostic form. */
export function safeHref(input: t.StringUrl | undefined): t.StringUrl {
  if (!input) return '';
  const canonical = Url.toCanonical(input);
  return canonical.ok ? canonical.href : '';
}

/** Parse one absolute normalized HTTP(S) request URL. */
export function parseUrl(input: t.StringUrl): URL | undefined {
  try {
    const url = new URL(input);
    if (!isHttp(url) || url.username || url.password) return;
    url.hash = '';
    return url;
  } catch {
    return;
  }
}

/** Resolve one normalized HTTP(S) redirect target. */
export function resolveRedirect(current: URL, location: string | null): URL | undefined {
  if (!Is.str(location) || !location.trim()) return;
  try {
    const next = new URL(location, current);
    if (!isHttp(next) || next.username || next.password) return;
    next.hash = '';
    return next;
  } catch {
    return;
  }
}

function validate(input: unknown): PolicyValidation {
  const keys = [
    'maxBytes',
    'timeout',
    'maxRedirects',
    'progressInterval',
    'sourceOrigins',
    'credentialOrigins',
  ] as const;
  if (!Is.object(input) || !keys.every((key) => Obj.hasOwn(input, key))) return { ok: false };

  const value = input as t.HttpFetch.ResponsePolicy;
  if (!isSafeInt(value.maxBytes, 0)) return { ok: false };
  if (!isSafeInt(value.timeout, 1)) return { ok: false };
  if (!isSafeInt(value.maxRedirects, 0)) return { ok: false };
  if (!isSafeInt(value.progressInterval, 1)) return { ok: false };
  if (!Arr.isArray(value.sourceOrigins) || !Arr.isArray(value.credentialOrigins)) {
    return { ok: false };
  }
  if (value.sourceOrigins.length === 0) return { ok: false };

  const sourceOrigins = validateOrigins(value.sourceOrigins);
  const credentialOrigins = validateOrigins(value.credentialOrigins);
  if (!sourceOrigins || !credentialOrigins) return { ok: false };
  if ([...credentialOrigins].some((origin) => !sourceOrigins.has(origin))) return { ok: false };

  return {
    ok: true,
    value: {
      maxBytes: value.maxBytes,
      timeout: value.timeout,
      maxRedirects: value.maxRedirects,
      progressInterval: value.progressInterval,
      sourceOrigins,
      credentialOrigins,
    },
  };
}

function validateOrigins(input: readonly t.StringUrl[]): ReadonlySet<string> | undefined {
  const origins = new Set<string>();
  for (const item of input) {
    if (!Is.str(item) || item !== item.trim()) return;
    try {
      const url = new URL(item);
      if (!isHttp(url) || url.username || url.password || item !== url.origin) return;
      if (origins.has(url.origin)) return;
      origins.add(url.origin);
    } catch {
      return;
    }
  }
  return origins;
}

function isSafeInt(input: unknown, minimum: number): input is number {
  return Num.Is.safeInt(input) && input >= minimum;
}

function isHttp(url: URL): boolean {
  return url.protocol === 'http:' || url.protocol === 'https:';
}
