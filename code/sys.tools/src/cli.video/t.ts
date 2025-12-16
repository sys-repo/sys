import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.namespace.ts';

/**
 * CLI utilities for processing and transforming video files.
 * Minimal, composable helpers that shell out to ffmpeg via @sys/process.
 */
export type VideoToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;

  /** Convert a .webm file to .mp4 (H.264/AAC). */
  readonly webmToMp4: t.VideoTool.WebmToMp4;
  /** Convert a .mp4 file to .webm (VP9/Opus). */
  readonly mp4ToWebm: t.VideoTool.Mp4ToWebm;
  /** Compute the next output file path (using the same lineage rules as CLI). */
  nextOutPath(args: { src: t.StringPath; toExt: '.mp4' | '.webm' }): Promise<t.StringPath>;
};
