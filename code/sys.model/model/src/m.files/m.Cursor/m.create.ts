import { type t } from './common.ts';
import { prefix, version } from './m.const.kind.ts';
import { fail } from './u.error.ts';
import { isKind, isToken } from './u.validate.ts';

/** Create a typed Files cursor string. */
export const create: t.Files.Cursor.Lib['create'] = (kind, token) => {
  if (!isKind(kind)) throw fail(`Invalid Files cursor kind: ${String(kind)}`);
  if (!isToken(token)) throw fail('Files cursor token must be a non-empty string');
  return `${prefix}:${kind}:${version}:${token}`;
};
