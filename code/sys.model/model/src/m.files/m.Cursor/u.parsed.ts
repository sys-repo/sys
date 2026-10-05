import { type t } from './common.ts';
import { prefix, version } from './m.const.kind.ts';

export function toParsed<K extends t.Files.Cursor.Kind>(
  kind: K,
  token: t.Files.Cursor.Token,
  value: t.Files.String.Cursor<K>,
): t.Files.Cursor.Parsed.Shape<K> {
  return { prefix, kind, version, token, value };
}
