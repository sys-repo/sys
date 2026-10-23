# HTTP

`@sys/http` provides GET/HEAD clients with explicit limits and Hono-based servers.

## Read data

Create a reusable client with `Http.fetcher` and an explicit response policy. `sourceOrigins` lists
where it may fetch; `credentialOrigins` lists which of those origins may receive your headers. The
limits below are examples, not defaults.

```ts
import { Http } from 'jsr:@sys/http/client';

const client = Http.fetcher({
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
  const response = await client.text('https://example.com');
  if (response.ok) {
    console.log(response.data);
  } else {
    console.error(response.error);
  }
} finally {
  client.dispose();
}
```

`json<T>`, `blob`, and `head` follow the same result pattern as `text`. Check `ok` before using
`data`, and dispose of the client when you no longer need it.

See the [client reference](https://jsr.io/@sys/http/doc/client/) for policy options, cancellation,
checksums, and progress reporting.

## Run a server

`create()` builds a bare Hono application; `start()` runs it on Deno and returns a managed server
handle. This example makes one local request, then closes the listener.

```ts
import { create, start } from 'jsr:@sys/http/server/host';

const app = create();
app.get('/', (c) => c.text('ready'));
const server = start(app);

try {
  const response = await fetch(server.origin);
  console.log(await response.text()); // ready
} finally {
  await server.dispose();
}
```

For a long-running service, keep the handle and await `server.dispose()` at shutdown. See the
[server reference](https://jsr.io/@sys/http/doc/server/host/) for listener and lifecycle options.

## Serve files or proxy requests

- [Serve a directory](https://jsr.io/@sys/http/doc/server/static/) with `HttpStatic.start`.
- [Serve supplied bytes](https://jsr.io/@sys/http/doc/server/file-bytes/) with `serveFileBytes`.
- [Run a reverse proxy](https://jsr.io/@sys/http/doc/server/proxy/) with `HttpProxy`.
- [Start a file server from the command line](https://jsr.io/@sys/http/doc/serve/).

[API reference](https://jsr.io/@sys/http/doc/) · [Type contracts](https://jsr.io/@sys/http/doc/t/)
