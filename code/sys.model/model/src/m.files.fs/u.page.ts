import { Files } from '../m.files/mod.ts';
import { Num, type t } from './common.ts';
import { fail } from './u.error.ts';

export type PageInput<K extends t.Files.Cursor.Kind> = {
  readonly kind: K;
  readonly cursor?: t.Files.StringCursor<K>;
  readonly limit?: t.Files.Limit;
  readonly defaultLimit: t.Files.Limit;
};

export type PageArgs<K extends t.Files.Cursor.Kind, T> = PageInput<K> & {
  readonly items: readonly T[];
};

export type Page<T, K extends t.Files.Cursor.Kind> = {
  readonly items: readonly T[];
  readonly cursor?: t.Files.StringCursor<K>;
  readonly truncated?: boolean;
};

export const validatePageInput = <K extends t.Files.Cursor.Kind>(args: PageInput<K>): void => {
  offsetFromCursor(args.kind, args.cursor);
  pageLimit(args.limit, args.defaultLimit);
};

export const page = <K extends t.Files.Cursor.Kind, T>(args: PageArgs<K, T>): Page<T, K> => {
  const offset = offsetFromCursor(args.kind, args.cursor);
  const limit = pageLimit(args.limit, args.defaultLimit);
  const next = offset + limit;
  const items = args.items.slice(offset, next);
  const hasMore = next < args.items.length;

  return {
    items,
    ...(hasMore ? { cursor: Files.Cursor.create(args.kind, String(next)) } : {}),
    ...(hasMore ? { truncated: true } : {}),
  };
};

/**
 * Helpers:
 */

const pageLimit = (
  limit: t.Files.Limit | undefined,
  defaultLimit: t.Files.Limit,
): t.Files.Limit => {
  const value = limit ?? defaultLimit;
  if (!Num.Is.safeInt(value) || value < 1) {
    throw fail('FilesFsError.InvalidPath', 'Invalid Files page limit');
  }
  return value;
};

const offsetFromCursor = <K extends t.Files.Cursor.Kind>(
  kind: K,
  cursor?: t.Files.StringCursor<K>,
): number => {
  if (cursor === undefined) return 0;

  const parsed = Files.Cursor.parse(cursor);
  if (!parsed || parsed.kind !== kind) {
    throw fail('FilesFsError.InvalidPath', 'Invalid Files cursor');
  }

  const offset = Number.parseInt(parsed.token, 10);
  if (!Num.Is.safeInt(offset) || offset < 0 || String(offset) !== parsed.token) {
    throw fail('FilesFsError.InvalidPath', 'Invalid Files cursor token');
  }
  return offset;
};
