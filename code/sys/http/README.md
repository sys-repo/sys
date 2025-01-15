# HTTP
Tools for working with [HTTP](https://www.w3.org/Protocols/), the foundational protocol of the "world wide web."



### HTTP Client
Fetch tools:

```ts
import { Http } from '@sys/http/client'
```

### HTTP Server
Serving tools. A lightweight, highly performant, HTTP server that can run locally or at the "edges" ([WinterTC](https://wintertc.org/)):

```ts
import { HttpServer, Net } from '@sys/http/server'
```


### Start from JSR



`--allowRun` allows keyboard interaction from the terminal, eg: "o" to open in browser.

```bash
deno run -RNE --allow-run jsr:@sys/http/server/start --port=1234
```

