import type { t } from './common.ts';

/**
 * CLI utilities for processing and transforming video files.
 * Minimal, composable helpers that shell out to ffmpeg via @sys/process.
 */
export type VideoToolsLib = {
  /** Convert a .webm file to .mp4 (H.264/AAC). */
  readonly webmToMp4: t.WebmToMp4;
  /** Convert a .mp4 file to .webm (VP9/Opus). */
  readonly mp4ToWebm: t.Mp4ToWebm;
  /** Compute the next output file path (using the same lineage rules as CLI). */
  nextOutPath(args: { src: t.StringPath; toExt: '.mp4' | '.webm' }): Promise<t.StringPath>;
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(opts?: { dir?: t.StringDir }): Promise<void>;
};

/** Supported video conversion directions. */
export type Conversion = 'webm-to-mp4' | 'mp4-to-webm';

/**
 * Convert: from .webm → .mp4
 */
export type WebmToMp4 = (args: {
  readonly src: string;
  readonly out?: string; //       default: <src>.mp4
  readonly crf?: number; //       default: 18
  readonly aacKbps?: number; //   default: 160
}) => Promise<string>;

/**
 * Convert: from .mp4 → .webm
 */
export type Mp4ToWebm = (args: {
  readonly src: string;
  readonly out?: string; //       default: <src>.webm
  readonly crf?: number; //       default: 32  (size-first: raise; quality-first: lower)
  readonly opusKbps?: number; //  default: 96
}) => Promise<string>;
