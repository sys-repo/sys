import { Is, type t } from './common.ts';
import { Kind, prefix, version } from './m.const.kind.ts';
import { toParsed } from './u.parsed.ts';
import { isKind, isToken } from './u.validate.ts';

/** Parse and validate a Files cursor string. */
export const parse: t.Files.Cursor.Lib['parse'] = (input) => {
  if (!Is.string(input)) return undefined;

  const parts = input.split(':');
  if (parts.length < 5) return undefined;

  const [segment0, segment1, kind, cursorVersion, ...tokenParts] = parts;
  if (`${segment0}:${segment1}` !== prefix) return undefined;
  if (!isKind(kind)) return undefined;
  if (cursorVersion !== version) return undefined;

  const token = tokenParts.join(':');
  if (!isToken(token)) return undefined;

  if (kind === Kind.list) return toParsed(kind, token, input as t.Files.Cursor.List);
  if (kind === Kind.watch) return toParsed(kind, token, input as t.Files.Cursor.Watch);
  return toParsed(kind, token, input as t.Files.Cursor.Manifest);
};
