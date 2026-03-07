# @sys/driver-process
A collection of thin, typed process drivers that adapt external CLI tools into stable, policy-free TypeScript APIs.

## FFmpeg
**FFmpeg** process driver exposing media inspection and transformation capabilities
via `ffprobe` and `ffmpeg`.

#### Purpose
Exposes **capabilities**, not policy.
All I/O happens via `@sys/process`. No schema, no UI, no assumptions.


#### Usage
```ts
import { Ffmpeg } from 'jsr:@sys/driver-process/ffmpeg';

const duration = await Ffmpeg.Ffprobe.duration('/path/video.webm');
// → t.Msecs | undefined
```

<p>&nbsp;</p>

## Git
**Git** source control process driver.

Exposes a thin, typed wrapper over core Git CLI capabilities.

Uses Git’s **porcelain** output format for machine-stable parsing (designed by Git specifically for tooling, unlike human-oriented output which may change).

```ts
import { Git } from 'jsr:@sys/driver-process/git';

// Runtime capability check
const probe = await Git.probe();
if (!probe.ok) {
  // git not available
}

// Get working tree status via `git status --porcelain`
const status = await Git.status();

if (status.ok) {
  for (const e of status.entries) {
    console.log(e.index, e.worktree, e.path);
  }
}
