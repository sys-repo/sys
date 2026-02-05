/**
 * @module
 */
import { type t, ClientLoader, D } from './common.ts';
import { SlugHttpOrigin as UI } from './ui.tsx';

export const SlugOrigin: t.SlugHttpOriginLib = {
  UI,
  Origin: ClientLoader.Origin,
  Default: { spec: D.spec },
};
