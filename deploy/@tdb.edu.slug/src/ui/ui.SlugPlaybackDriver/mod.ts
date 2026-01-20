/**
 * @module
 * Slug-aware media playback driver that connects TreeHost selection
 * to audiovisual content rendering within aux slot.
 */
import { Dev } from './-dev/mod.ts';
import type { t } from './common.ts';
import { Controller } from './m.Controller.ts';

export const SlugPlaybackDriver: t.SlugPlaybackDriverLib = {
  Dev,
  Controller,
};
