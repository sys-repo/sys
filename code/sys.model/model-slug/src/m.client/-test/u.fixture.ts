export type HttpFixtureResponse = {
  readonly status?: number;
  readonly statusText?: string;
};

export function jsonResponse(body: unknown, options: HttpFixtureResponse = {}): Response {
  return new Response(JSON.stringify(body), {
    status: options.status ?? 200,
    statusText: options.statusText ?? 'OK',
    headers: { 'content-type': 'application/json' },
  });
}

export function textResponse(text: string, options: HttpFixtureResponse = {}) {
  return new Response(text, {
    status: options.status ?? 200,
    statusText: options.statusText ?? 'OK',
  });
}

export function stubFetch(handler: (url: string, init?: RequestInit) => Response) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    return handler(url, init);
  };
  return () => {
    globalThis.fetch = originalFetch;
  };
}
