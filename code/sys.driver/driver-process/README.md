# @sys/driver-process

Typed adapters for external FFmpeg and Git command-line tools, using `@sys/process` for I/O.

Install the tools you need and grant Deno permission to run them. You choose the files, repository,
and operations.

## Inspect media

`/ffmpeg` exposes binary probing and media duration, not a general transcoding API. `Ffmpeg.probe()`
checks tool availability; `Ffmpeg.duration()` uses `ffprobe` and returns a result that must be
narrowed before reading milliseconds.

```ts
import { Ffmpeg } from 'jsr:@sys/driver-process/ffmpeg';

const result = await Ffmpeg.duration('./video.webm');
if (result.ok) {
  console.info(result.msecs);
} else {
  console.info(result.reason);
}
```

Provide an existing media file. Importing the package does not install FFmpeg or grant Deno
permissions.

## Inspect a Git working tree

`/git` parses Git's machine-oriented porcelain status output. This example observes the current
repository without changing it:

```ts
import { Git } from 'jsr:@sys/driver-process/git';

const status = await Git.status();
if (status.ok) {
  for (const entry of status.entries) {
    console.info(entry.index, entry.worktree, entry.path);
  }
} else {
  console.info(status.reason);
}
```

Run from a Git working tree with Git installed and permission to invoke it. `Git.probe()` checks
availability; it does not establish that a directory is a repository. Pass `untracked: false` to
`Git.status` when untracked entries should be excluded.

See the [API documentation](https://jsr.io/@sys/driver-process/doc) for options and result variants.
