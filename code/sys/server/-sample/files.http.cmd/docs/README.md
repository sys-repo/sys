# Files HTTP Cmd Sample

```sh
deno task sample:files:http:cmd
```

Copies this real `./docs` folder to a runtime temp directory, generates a `dist.json` with
`Pkg.Dist.compute(...)`, then exposes the resulting static/dist Files backing over unary HTTP Cmd.

```text
./docs → temp root → Pkg.Dist.compute(save) → FilesStatic.fromDist → POST /files via HttpCmd.handle
```

Use this lane for request/response Files commands: `list`, `stat`, `read`, `manifest`. Manifest
entries carry dist `size` and `hash` metadata. Reads return content refs rather than inline file
text.

Not this lane: plain static HTTP publication (`sample:files:http:static`) or live `files:watch`
streaming (`sample:files:ws`).
