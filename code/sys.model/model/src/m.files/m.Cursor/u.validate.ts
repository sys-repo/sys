import { Is, type t } from './common.ts';
import { Kind } from './m.const.kind.ts';

export function isKind(input: unknown): input is t.Files.Cursor.Kind {
  return input === Kind.list || input === Kind.watch || input === Kind.manifest;
}

export function isToken(input: unknown): input is t.Files.Cursor.Token {
  return Is.string(input) && input.length > 0;
}
