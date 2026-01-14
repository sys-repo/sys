# @sys/driver-ffmpeg
Thin, typed system driver for FFmpeg tooling (`ffprobe`, `ffmpeg`).

## Purpose
Expose **capabilities**, not policy:
- Media inspection (duration, streams)
- Future: transcode, thumbnail, probe metadata

All I/O happens via `@sys/process`. No schema, no UI, no assumptions.

## Status
- Initial focus: `ffprobe` duration
- Non-strict by default (absence = `undefined`, not failure)

## Usage
```ts
import { Ffmpeg } from 'jsr:@sys/driver-ffmpeg';

const duration = await Ffmpeg.Ffprobe.duration('/path/video.webm');
// → t.Msecs | undefined
