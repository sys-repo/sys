# HTTP
Tools for working with [HTTP](https://www.w3.org/Protocols/), the foundational protocol of the "world wide web."


### HTTP Client
Fetch tools:

```ts
import { Http } from 'jsr:@sys/http/client';

const fetch = Http.Fetch.create({ accessToken: 'my-jwt' });
const fetch = Http.fetch();  // ← shorthand (alt).

const url = 'https://url.com/api';
const checksum = 'sha256-01234';

const json = fetch.json(url);
const text = fetch.text(url, { checksum }); // ← ensure content matches given hash.
```

Fine grained ability to cancel fetch operations.

```ts
import { rx } from '@sys/std';
import { Http } from 'jsr:@sys/http/client';

const { dispose$, dispose } = rx.disposable();

// Dispose aborts all in-progress operations.
const fetch = Http.fetch({ dispose$ });  
const fetch = Http.fetch(dispose$);       // (alternative)

// Dispose aborts the specific fetch operation.
const json = fetch.json(url, {}, { dispose$ });
const text = fetch.json(url, {}, { dispose$, checksum });
```


### HTTP Server
Serving tools. A lightweight, highly performant, HTTP server that can run locally or at the "edges" ([WinterTC](https://wintertc.org/)):

```ts
import { Net } from 'jsr:@sys/http/server';

// Port helpers.
const port1 = Net.port();
const port2 = Net.Port.random();
```

Standing up an HTTP server programatically:

```ts
import { HttpServer, Net } from 'jsr:@sys/http/server';


type T = { count: number };
app.get('/', (c) => c.json({ count: 123 }));

// Stand up an HTTP server.
const app = HttpServer.create();
const opts = HttpServer.options(1234, pkg);
const listener = Deno.serve(opts, app.fetch);

// HTTP client (calling back into the HTTP server).
const fetch = Http.fetch();
const url = Http.url(listener.addr);

const res = await fetch.json<T>(url.base);
res.data // ← { count: 123 }
```


Standing up an HTTP server via command line (from the `jsr:` registry) from the `/start` module entry.

`--allowRun` allows keyboard interaction from the terminal, eg: `o` key to open in browser.

```bash
deno run -RNE --allow-run jsr:@sys/http/server/start --port=1234
```


