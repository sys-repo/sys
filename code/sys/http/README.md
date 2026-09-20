# HTTP

HTTP fetch clients with explicit response limits, plus helpers for running servers.

## HTTP client

Every client requires an explicit response policy. The limits below are examples, not defaults.
`sourceOrigins` lists the exact HTTP(S) origins the client may request. `credentialOrigins` lists
which of those origins may receive caller-supplied or default headers. An empty `credentialOrigins`
list permits none of those headers.

```ts
import { Http } from 'jsr:@sys/http/client';

const lifetime = new AbortController();
const request = new AbortController();
const client = Http.fetcher({
  until: lifetime.signal,
  policy: {
    maxBytes: 1_000_000,
    timeout: 5_000,
    maxRedirects: 0,
    progressInterval: 100,
    sourceOrigins: ['https://example.com'],
    credentialOrigins: [],
  },
});

try {
  const response = await client.text('https://example.com', { signal: request.signal });
  if (response.ok) {
    console.log(response.data);
  } else {
    console.error(response.error);
  }
} finally {
  client.dispose();
}
```

Aborting `request` cancels that request. Aborting `lifetime`, or disposing the client, ends the
client's lifetime and aborts its active requests. Pass the lifetime signal as `until`, not
`dispose$`.

For integrity checking, pass the expected checksum in the **third** argument:
`client.text(url, { signal }, { checksum })` (also supported by `json` and `blob`). It is not a
`RequestInit` field. Check `response.ok` before reading `response.data`. `json<T>` provides a
TypeScript type; it does not validate the data against a schema.

## Managed HTTP server

The `/server/host` entrypoint provides a bare application and a managed listener. It does not
include static-file or CORS helpers. This Deno example requires network permission and closes the
listener after a local request.

```ts
import { create, start } from 'jsr:@sys/http/server/host';

const app = create();
app.get('/', (c) => c.text('ready'));
const server = start(app, { hostname: '127.0.0.1', port: 8080, strictPort: true });

try {
  const response = await fetch(server.origin);
  console.log(await response.text()); // ready
} finally {
  await server.dispose();
}
```

## Entry points

- [`/client`](https://jsr.io/@sys/http/doc/client/): fetch clients and HTTP utilities.
- [`/server/host`](https://jsr.io/@sys/http/doc/server/host/): bare `create` and managed `start`.
- [`/server`](https://jsr.io/@sys/http/doc/server/): broader `HttpServer` and `Net` helpers.
- [`/server/static`](https://jsr.io/@sys/http/doc/server/static/) and
  [`/server/file-bytes`](https://jsr.io/@sys/http/doc/server/file-bytes/): explicit file-serving
  APIs.
- [`/serve`](https://jsr.io/@sys/http/doc/serve/): command-line file server.
- [`/t`](https://jsr.io/@sys/http/doc/t/): type contracts.

See the [API reference](https://jsr.io/@sys/http/doc/) for proxy, lifecycle, and command helpers.
