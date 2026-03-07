/**
 * @module
 */
import { type t, SlugLoader, D } from './common.ts';
import { SlugHttpOrigin as UI } from './ui.tsx';

export const SlugOrigin: t.SlugHttpOriginLib = {
  UI,
  Origin: SlugLoader.Origin,
  Default: { spec: D.spec },
};
