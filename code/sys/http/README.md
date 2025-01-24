# HTTP
Tools for working with [HTTP](https://www.w3.org/Protocols/), the foundational protocol of the "world wide web."


### HTTP Client
Fetch tools:

```ts
import { Http } from 'jsr:@sys/http/client'

const fetch = Http.Fetch.create({ accessToken: 'my-jwt' });
const fetch = Http.fetch();  // ← shorthand (alt),

const url = 'https://url.com/api';
const checksum = 'sha256-01234'

const json = fetch.json(url)
const text = fetch.text(url, { checksum }); // ← ensure content matches given hash.
```

Fine grained ability to cancel fetch operations.

```ts
import { rx } from '@sys/std';
import { Http } from 'jsr:@sys/http/client';

const { dispose$, dispose } = rx.disposable();

// Dispose aborts all in-progress operations.
const fetch = Http.fetch(dispose$);  

// Dispose aborts only the single fetch operation.
const json = fetch.json(url, {}, { dispose$ })
```


### HTTP Server
Serving tools. A lightweight, highly performant, HTTP server that can run locally or at the "edges" ([WinterTC](https://wintertc.org/)):

```ts
import { HttpServer, Net } from 'jsr:@sys/http/server';

const port1 = Net.port();
const port2 = Net.Port.random();
```


### Start HTTP Server from JSR

`--allowRun` allows keyboard interaction from the terminal, eg: "o" to open in browser.

```bash
deno run -RNE --allow-run jsr:@sys/http/server/start --port=1234
```


