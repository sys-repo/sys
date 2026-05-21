# Files WebSocket Sample

A bounded Files backing, hosted over WebSocket, consumed through a typed `Files` client.

```ts
const files = Files.Fs.Readonly.live({ fs, root, policy });
const server = FilesServer.WebSocket.start({ files });

const client = await Files.Client.websocket(server.url);
const res = await client.send(Files.Cmd.Name.read, { path: 'README.md' });
```

The shape is intentionally simple:

```text
Files backing → Files WebSocket server → Files client
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

// 2. Host it over WebSocket.
const server = FilesServer.WebSocket.start({
  path: '/files',
  files,
});

// 3. Connect a typed Files client.
const client = await Files.Client.websocket(server.url);

try {
  const readme = await client.send(Files.Cmd.Name.read, { path: 'README.md' });

  if (readme.kind === 'inline') {
    console.info(readme.content);
  }
} finally {
  await client.close('done');
  await server.close('done');
}
```

Run it with:

```sh
deno task sample:files
```
