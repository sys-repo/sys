# Files Static Sample

Run sample with:

```sh
deno task sample:files:static
```

---

A generated `dist.json` bundle, served by plain static HTTP, reconstructed as a bounded `Files`
client view.

```ts
const fetched = await Pkg.Dist.fetch({ origin });
if (!fetched.dist) throw new Error('Expected dist.json.');

const backing = FilesStatic.fromDist({ dist: fetched.dist, baseUrl: origin, policy });
const files = Files.Client.local(backing);
const read = await files.cmd.send(Files.Cmd.Name.read, { path: 'docs/README.md' });
```

The shape is intentionally simple:

```text
dist.json + assets → static HTTP server → FilesStatic backing → Files client → URL content ref
```

This complements the WebSocket sample:

```text
files.websocket = live authoring/dev mode over WebSocket
files.static    = generated publication/runtime mode over static HTTP
```

Full version:

```ts
import { HttpStatic } from '@sys/http/server/static';
import { Files } from '@sys/model/files';
import { FilesStatic } from '@sys/model/files/static';
import { Pkg } from '@sys/std/pkg';

const server = await HttpStatic.start({ dir: './dist' });

try {
  const origin = server.origin;
  const fetched = await Pkg.Dist.fetch({ origin });
  if (!fetched.dist) throw new Error('Expected dist.json.');

  const policy = Files.Policy.readonly('**');
  const backing = FilesStatic.fromDist({ dist: fetched.dist, baseUrl: origin, policy });
  const files = Files.Client.local(backing);

  try {
    const read = await files.cmd.send(Files.Cmd.Name.read, { path: 'docs/README.md' });

    if (read.kind === 'ref' && read.contentRef.kind === 'url') {
      const asset = await fetch(read.contentRef.url);
      console.info(await asset.text());
    }
  } finally {
    files.dispose('done');
  }
} finally {
  await server.close('done');
}
```
