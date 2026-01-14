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

```ts
import { Git } from 'jsr:@sys/driver-process/git';
```

