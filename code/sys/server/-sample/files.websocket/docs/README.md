# Files WebSocket Sample

Run sample with:

```sh
deno task sample:files
```

---

A bounded Files backing, hosted over WebSocket, consumed through a typed `Files` client.

```ts
const backing = Files.Fs.Readonly.live({ fs, root, policy });

const local = Files.Client.local(backing);
const text = await local.readText('README.md');

const server = FilesServer.WebSocket.start({ files: backing });
const remote = await Files.Client.websocket(server.url);
const remoteText = await remote.readText('README.md');
```

The shape is intentionally simple:

```text
Files backing → local client
              → Files WebSocket server → remote client
```

Full version:

```ts
import { Fs } from '@sys/fs';
import { Files } from '@sys/model/files/fs';
import { FilesServer } from '@sys/server/files';

// 1. Create a bounded Files backing.
const files = Files.Fs.Readonly.live({
  fs: Fs.Capability.Files.Readonly.live(Fs),
  root: './docs',
  policy: Files.Policy.readonly('**'),
});

// 2. Use the same handle shape locally.
const local = Files.Client.local(files);
console.info(await local.readText('README.md'));
local.dispose('done');

// 3. Or host it over WebSocket.
const server = FilesServer.WebSocket.start({
  path: '/files',
  files,
});

// 4. Connect a typed Files client.
const client = await Files.Client.websocket(server.url);

try {
  console.info(await client.readText('README.md'));
} finally {
  await client.close('done');
  await server.close('done');
}
```

