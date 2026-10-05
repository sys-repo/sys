# @sys/model

Shared models for bounded file access and timecode playback manifests. The package includes types,
schemas, Files clients, and backing adapters—not just pure data transformations.

The root exports package metadata and types. Import runtime APIs from their subpaths.

## Entry points

- [`/files`](https://jsr.io/@sys/model/doc/files): `Files` contracts, commands, policy, content
  references, and clients.
- **Files backings:** [`/files/memory`](https://jsr.io/@sys/model/doc/files/memory) exports
  `FilesMemory`; [`/files/fs`](https://jsr.io/@sys/model/doc/files/fs) exports `Files` with
  filesystem-shaped adapters at `Files.Fs`;
  [`/files/static`](https://jsr.io/@sys/model/doc/files/static) exports `FilesStatic.fromDist` for a
  static `dist.json` view.
- [`/timecode/playback`](https://jsr.io/@sys/model/doc/timecode/playback): `PlaybackSchema`
  validates playback manifests; it is not a player.

Use `/t` or the corresponding subpath's `/t` entry for types. See the
[API documentation](https://jsr.io/@sys/model/doc) for adapter and client contracts.

## Read an in-memory file

This readonly backing permits one path and caps reads at 1,024 bytes. It needs neither disk nor
network access.

```ts
import { Files } from 'jsr:@sys/model/files';
import { FilesMemory } from 'jsr:@sys/model/files/memory';

const backing = FilesMemory.Readonly.create({
  files: { 'hello.txt': 'Hello from Files' },
  policy: Files.Policy.readonly('hello.txt', { maxReadBytes: 1024, watch: false }),
});
const files = Files.Client.local(backing);

try {
  console.info(await files.readText('hello.txt')); // Hello from Files
} finally {
  files.dispose();
}
```

Backings default to deny-all policy. Capabilities describe supported operations; they do not
authorize paths. The local client owns its transport, so dispose it when finished. `readText`
returns inline text or rejects; it does not fetch content references.
