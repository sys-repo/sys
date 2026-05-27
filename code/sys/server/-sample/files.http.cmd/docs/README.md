# Files HTTP Cmd Sample

```sh
deno task sample:files:http:cmd
```

Serves this real `./docs` folder as a bounded Files backing over unary HTTP Cmd.

```text
./docs → Files.Fs.Readonly.create → POST /files via HttpCmd.handle → HttpCmd.client
```

Use this lane for request/response Files commands: `list`, `stat`, `read`, `manifest`.

Not this lane: static publication (`sample:files:http:static`) or live `files:watch` streaming
(`sample:files:ws`).
