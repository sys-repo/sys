import { type t } from './common.ts';
import { compose } from './u.compose.ts';
import { make } from './u.make.ts';

export const Factory: t.FactoryLib = {
  make,
  compose,
};
