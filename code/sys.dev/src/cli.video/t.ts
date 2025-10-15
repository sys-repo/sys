import type { t } from './common.ts';

/**
 * CLI utilities for processing and transforming video files.
 * Minimal, composable helpers that shell out to ffmpeg via @sys/process.
 */
export type VideoToolsLib = {};

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
