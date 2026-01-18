/**
 * @module
 * Slug-aware media playback driver that connects TreeHost selection
 * to audiovisual content rendering within the aux slot. *
 */
import type { t } from './common.ts';
import { Controller } from './m.Controller.ts';

export const SlugPlaybackDriver: t.SlugPlaybackDriverLib = {
  Controller,
};
