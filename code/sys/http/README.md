# HTTP

Bounded HTTP fetch clients and composable server helpers.

## HTTP client

Every client requires an explicit response policy. These example limits are application
choices, not library defaults. `sourceOrigins` admits exact HTTP(S) origins;
`credentialOrigins` selects admitted origins that may receive caller/default headers.
An empty credential list grants none.

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

Aborting `request` cancels that request. Aborting `lifetime`, or disposing the client,
ends the client lifecycle and aborts its in-flight requests. Bind lifecycle with `until`,
not `dispose$`.

For integrity checking, pass the expected checksum in the **third** argument:
`client.text(url, { signal }, { checksum })` (also supported by `json` and `blob`).
It is not a `RequestInit` field. Narrow `response.ok` before using `response.data`;
`json<T>` supplies a static type, not runtime schema validation.

## Managed HTTP server

The `/server/host` leaf creates a bare application and managed listener without
static-file or CORS helpers. This Deno example requires network permission and
closes the listener after a local request.

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
  [`/server/file-bytes`](https://jsr.io/@sys/http/doc/server/file-bytes/): explicit file-serving surfaces.
- [`/serve`](https://jsr.io/@sys/http/doc/serve/): command-line file server.
- [`/t`](https://jsr.io/@sys/http/doc/t/): type contracts.

See the [API reference](https://jsr.io/@sys/http/doc/) for proxy, lifecycle, and command helpers.
