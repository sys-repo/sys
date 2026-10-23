import { Is, type t } from '../common.ts';
import { Part } from '../m/m.Dist.Part.ts';

export function pkg(input: unknown): input is t.Pkg {
  return Is.object(input) &&
    'name' in input && Is.str(input.name) &&
    'version' in input && Is.str(input.version);
}

export function sha256Hash(input: unknown): input is t.StringHash {
  const parsed = Part.parse(input);
  return parsed !== undefined && parsed.hash === input && parsed.size === undefined;
}
