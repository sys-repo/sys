# Files HTTP Cmd Sample

```sh
deno task sample:files:http
```

Serves this real `./docs` folder as a bounded Files backing over unary HTTP Cmd.

```text
./docs → Files.Fs.Readonly.create → POST /files via HttpCmd.handle → HttpCmd.client
```

Use this lane for request/response Files commands: `list`, `stat`, `read`, `manifest`.

Not this lane: static publication (`files.static`) or live `files:watch` streaming
(`files.websocket`).
