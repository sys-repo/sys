import { CommonInfoFields as Fields } from './Common.Info.Fields.ts';
import { DEFAULTS } from './common.ts';
import { Wrangle } from './u.ts';

/**
 * Common helpers and configuration for an <Info> panel.
 */
export const CommonInfo = {
  DEFAULTS,
  Fields,
  Wrangle,
  title: Wrangle.title,
  width: Wrangle.width,
} as const;
