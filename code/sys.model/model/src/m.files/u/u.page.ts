import { Num, type t } from '../common.ts';
import { Cursor } from '../m.Cursor/mod.ts';

export type FilesInvalid = (message: string) => Error;

export type PageInput<K extends t.Files.Cursor.Kind> = {
  readonly kind: K;
  readonly cursor?: t.Files.String.Cursor<K>;
  readonly limit?: t.Files.Limit;
  readonly defaultLimit: t.Files.Limit;
};

export type PageArgs<K extends t.Files.Cursor.Kind, T> = PageInput<K> & {
  readonly items: readonly T[];
};

export type Page<T, K extends t.Files.Cursor.Kind> = {
  readonly items: readonly T[];
  readonly cursor?: t.Files.String.Cursor<K>;
  readonly truncated?: boolean;
};

/** Validate shared Files page/cursor input. */
export const validatePageInput = <K extends t.Files.Cursor.Kind>(
  args: PageInput<K>,
  invalid: FilesInvalid,
): void => {
  offsetFromCursor(args.kind, args.cursor, invalid);
  pageLimit(args.limit, args.defaultLimit, invalid);
};

/** Page a deterministic Files item list. */
export const page = <K extends t.Files.Cursor.Kind, T>(
  args: PageArgs<K, T>,
  invalid: FilesInvalid,
): Page<T, K> => {
  const offset = offsetFromCursor(args.kind, args.cursor, invalid);
  const limit = pageLimit(args.limit, args.defaultLimit, invalid);
  const next = offset + limit;
  const items = args.items.slice(offset, next);
  const hasMore = next < args.items.length;

  return {
    items,
    ...(hasMore ? { cursor: Cursor.create(args.kind, String(next)) } : {}),
    ...(hasMore ? { truncated: true } : {}),
  };
};

/**
 * Helpers:
 */

const pageLimit = (
  limit: t.Files.Limit | undefined,
  defaultLimit: t.Files.Limit,
  invalid: FilesInvalid,
): t.Files.Limit => {
  const value = limit ?? defaultLimit;
  if (!Num.Is.safeInt(value) || value < 1) throw invalid('Invalid Files page limit');
  return value;
};

const offsetFromCursor = <K extends t.Files.Cursor.Kind>(
  kind: K,
  cursor: t.Files.String.Cursor<K> | undefined,
  invalid: FilesInvalid,
): number => {
  if (cursor === undefined) return 0;

  const parsed = Cursor.parse(cursor);
  if (!parsed || parsed.kind !== kind) throw invalid('Invalid Files cursor');

  const offset = Number.parseInt(parsed.token, 10);
  if (!Num.Is.safeInt(offset) || offset < 0 || String(offset) !== parsed.token) {
    throw invalid('Invalid Files cursor token');
  }
  return offset;
};
