import { Is, ObjectPath as Path, Json as Util, type t } from '../common.ts';
import { Patch } from '../m.Json.Patch/mod.ts';
import { PatchState } from '../m.Json.PatchState/mod.ts';

export type ImmerJsonLib = {
  readonly Patch: t.PatchTool;
  // readonly PatchState
  readonly Path: t.ObjectPathLib;
  isJson: t.CommonIsLib['json'];
  stringify: t.JsonLib['stringify'];
};

export const Json = {
  Patch,
  PatchState,
  Path,
  isJson: Is.json,
  stringify: Util.stringify,
} as const;
