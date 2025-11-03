import { type t } from './common.ts';
import { cli } from './u.cli.ts';
import { mp4ToWebm, webmToMp4 } from './u.convert.ts';
import { nextOutPath } from './u.file.name.ts';

/**
 * VideoTools
 * Programmatic utilities for video conversion.
 * Designed for direct use in code or automated pipelines (no CLI prompts).
 */
export const VideoTools: t.VideoToolsLib = {
  cli,
  webmToMp4,
  mp4ToWebm,
  nextOutPath,
};
