# HTTP

`@sys/http` provides bounded HTTP clients, unary Cmd transport, and Hono-based servers.

## Read data

`Http.fetcher` creates a reusable client. `sourceOrigins` lists the origins it may contact. Only
origins in `credentialOrigins` receive headers set by the client or the caller. This does not enable
browser cookies: the client uses `credentials: 'omit'`. The limits below are examples, not defaults.

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

`json<T>`, `blob`, and `head` use the same result shape as `text`. `json<T>` parses JSON but does
not validate it against `T`. `head` returns status and headers without a body.

See the [client reference](https://jsr.io/@sys/http/doc/client/) for policy options, cancellation,
checksums, and progress reporting.

## Exchange unary commands

Use `HttpCmd` from `@sys/http/cmd` for one JSON command and one reply. The client sends to a fixed
URL. On the server, set the handler's `path` or let the router select the handler. Both ends require
request and response byte limits and a timeout. Your application validates payloads and
authenticates callers.

A timeout after dispatch does not tell you whether the command ran. Do not retry a state-changing
command on that evidence alone. See the [bounded Cmd guide](./src/http.cmd/README.md) for setup,
shutdown, migration, error handling, and
[browser verification](./src/http.cmd/README.md#verify-the-browser-transport).

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

### Reserve an exact proxy route

Use an exact route for one HTTP method at one pathname; use a mount for a subtree. A pathname can
appear only once in `exactRoutes`, even for different methods. Pass the list to `HttpProxy.create`
or `HttpProxy.start`, or declare it in `proxy.yaml`:

```yaml
name: local-proxy
hostname: 127.0.0.1
port: 1234
root:
  target: http://127.0.0.1:4040/
mounts: []
exactRoutes:
  - path: /commands/run
    method: POST
    target: http://127.0.0.1:4041/submit
```

Load the file with `await HttpProxy.start({ paths: { config: './proxy.yaml' } })`.

`POST /commands/run?x=1` forwards to the fixed target at `/submit?x=1`. The proxy returns upstream
redirects without following them. Other methods at `/commands/run` receive `405` with `Allow: POST`
without reaching any upstream.

The exact route takes precedence over mount slash redirects. `/commands/run/` and
`/commands/run/other` are different pathnames; both go to the root upstream in this example. A route
match does not authorize the caller or its origin.

## References

- [API reference](https://jsr.io/@sys/http/doc/)
- [Type contracts](https://jsr.io/@sys/http/doc/t/)
