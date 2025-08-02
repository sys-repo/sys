import { type t } from './common.ts';
import { pathAtOffset } from './u.pathAtOffset.ts';

export const Path: t.YamlPathLib = {
  atOffset: pathAtOffset,
};

