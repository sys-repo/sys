# Bounded unary HttpCmd

`HttpCmd.client`, `handle`, and `handler` exchange canonical unary Cmd JSON envelopes over a fixed
HTTP(S) endpoint. They do not implement domain validation, authentication, idempotency, retries, or
transaction receipts. Namespace and request IDs are routing/correlation, not authority.

## Construction and migration

This guide describes the bounded source API; published `@sys/http@0.0.335` has the previous options.
Both directions require explicit positive safe-integer policy. There are no library defaults. For a
host exposing `echo` in the `example` namespace:

```ts
import { HttpCmd } from '@sys/http/cmd';

const policy = {
  maxBytes: { request: 1024 * 1024, response: 8 * 1024 * 1024 },
  timeout: 30_000,
};
const client = HttpCmd.client({ url: 'https://example.com/cmd', ns: 'example', policy });
try {
  await client.send('echo', { text: 'hello' });
} finally {
  client.dispose();
}
```

Supply your endpoint, namespace, command grammar, and limits. Reuse the client within its owning
lifetime; the example disposes it after one call. Domain bindings must validate returned payloads
before use. On the server, supply handlers that validate their inputs:

```ts
const handler = HttpCmd.handler({ path: '/cmd', policy, cmd: { ns: 'example', handlers } });
```

The example limits are host choices, not defaults. Replace the former client `timeout` option with
`policy.timeout`. Factories reject invalid configuration synchronously with a safe `HttpCmd.Error`;
direct `handle(request, options)` returns a rejected promise. No request or handler is invoked for
invalid configuration. `handler` snapshots once; direct `handle` snapshots per request before
suspension. Only own enumerable callable handlers are registered. Omitted `path` delegates routing
to the mount owner. Emitted Cmd events remain intentionally ignored.

Endpoint, namespace, fetch, policy, and construction headers are snapshotted. The endpoint must be
absolute HTTP(S), without userinfo or fragment. Use authenticated, appropriately secured hosts; the
injectable fetch seam is trusted code, not a sandbox. Construct request-local handlers around one
request's authority. Do not share a mutable current principal.

Two-argument `send(name, payload)` calls remain valid and the client remains assignable to
`Cmd.Client.Unary`. Optional `send(name, payload, { headers, signal })` captures per-call headers
before suspension. They override construction headers case-insensitively; the signal affects only
that call. Client disposal cancels all pending sends and prevents future dispatch. Caller option
objects cannot override the endpoint, method, timeout, credentials, redirects, or caching policy.

The transport fixes POST, JSON Accept/Content-Type, credential omission, manual redirects, no-store
caching, and referrer suppression. Explicit request-local Authorization is allowed. Cookie, Cookie2,
Host, Content-Length, Transfer-Encoding, Connection, Origin, and Referer headers are rejected. All
owned responses use `Cache-Control: no-store`. Origin/CORS admission belongs to the surrounding
request binding, not authentication or generic HttpCmd configuration.

## Settlement and wire behavior

Byte caps count the complete UTF-8 envelope, not just payloads. Incoming streams are counted even
when Content-Length is false or absent; zero-length chunks are not retained. JSON decoding rejects
malformed UTF-8.

Each local operation has one deadline covering serialization, fetch/read or handler work, and result
adoption. Waiting settles even if fetch, a handler, a read, or cancellation ignores abort.
Settlement stops owned timers and detaches native signal listeners. Body cancellation and reader
release are best effort, not prerequisites for settlement; an uncooperative reader may retain its
lock. Late fetch bodies are cancelled when they arrive; late handler results are discarded without
serialization. The first selected terminal cause survives cleanup-triggered abort or expiry.

These bounds do not preempt synchronous CPU, force remote cooperation, bound total heap, or undo
effects. Serialization allocates before its byte limit is checked. Incoming chunks are counted
before retention; concatenation allocates another buffer after that accounting. Cancellation is not
awaited indefinitely.

Serialization uses `@sys/std` `Json.stringify(value, 0)`: repeated object references and cycles
become `"[Circular]"`. It is not a structured-clone or binary codec. Undefined payloads may be
omitted. BigInt and throwing serialization hooks fail before client dispatch. Domain bindings own
JSON-compatible DTO validation and result admission; generic TypeScript parameters do not prove
runtime shape or fidelity.

Any observed 3xx, redirected response, or opaque redirect is rejected without following it.
Otherwise a bounded, valid Cmd result must match request id, name, and namespace. A correlated
result without `error` resolves its payload **even on 4xx/5xx**. A string `error`, including an
empty string, takes precedence over payload and rejects with fixed `remote` classification.
`errorCause` and remote messages are never disclosed. Empty, invalid, or uncorrelated bodies reject
as `protocol`; body overflow rejects as `response-too-large`. Content-Type and status alone do not
certify domain success, rejection, or non-commit. Expected domain rejections belong in typed
results.

Server statuses are 200 for completed handler results, 400 for invalid/unreadable requests, 413 for
request overflow, 404 for path/namespace/unavailable-handler rejection, 405 with `Allow: POST` for
method mismatch, 408 for request cancellation, 504 for deadline, and 500 for handler or response
encoding/size failure. Failures before correlated admission have empty bodies. Admitted failures
carry only correlation and `error: 'HTTP command failed.'`; even `Cmd.Error.expose` is suppressed.
An error envelope exceeding the response cap falls back to an empty body with the same status.

## Failure knowledge

Client rejections are frozen native Errors with fixed `name: 'HttpCmdError'`, message
`HTTP command failed: <kind>.`, `kind`, `dispatch`, and optional numeric HTTP `status`. There is no
stack, raw cause, request/command identity, endpoint, header, payload, abort reason, remote message,
or status text. A caught object's name/properties never authenticate its classification.

Kinds are `invalid-options`, `invalid-request`, `request-too-large`, `response-too-large`,
`timeout`, `cancelled`, `disposed`, `network`, `redirect`, `protocol`, and `remote`. An opaque fetch
rejection is `network`, not evidence of a redirect. A remote timeout error envelope is `remote`, not
a local deadline event. Update consumers of the former `CmdError.*` names, command metadata, and
reflected handler/HTTP messages.

`dispatch: 'not-dispatched'` means this client did not invoke fetch. `possible` is latched
immediately before invocation, including a synchronous fetch throw; it never becomes proof of
non-commit after that point. Server handler-invocation knowledge is separate. Lost responses, error
statuses, timeouts, and disposal cannot prove rollback. No automatic retries occur. Domain bindings
must preserve this uncertainty rather than infer success, rollback, or permission to retry.
