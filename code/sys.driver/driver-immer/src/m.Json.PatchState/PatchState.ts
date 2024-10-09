import { Command } from './Command.ts';
import { Is } from './PatchState.Is.ts';
import { create } from './PatchState.impl.ts';
import { toObject, type t } from './common.ts';

export const PatchState: t.ImmerPatchStateLib = {
  Is,
  Command,
  create,
  toObject,
} as const;
