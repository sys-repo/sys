import { Files, Num, type t } from '../common.ts';
import { invalidPath } from './error.ts';

export const DEFAULT_LIMIT = 200 satisfies t.Files.Limit;

export type PageResult<T, K extends t.Files.Cursor.Kind> = {
  readonly items: readonly T[];
  readonly cursor?: t.Files.String.Cursor<K>;
  readonly truncated?: boolean;
};

/** Validate shared Files page/cursor inputs. */
export function validatePageInput<K extends t.Files.Cursor.Kind>(args: {
  readonly kind: K;
  readonly cursor?: t.Files.String.Cursor<K>;
  readonly limit?: t.Files.Limit;
  readonly defaultLimit: t.Files.Limit;
}): void {
  offsetFromCursor(args.kind, args.cursor);
  pageLimit(args.limit, args.defaultLimit);
}

/** Page a deterministic Files result list. */
export function page<K extends t.Files.Cursor.Kind, T>(args: {
  readonly kind: K;
  readonly items: readonly T[];
  readonly cursor?: t.Files.String.Cursor<K>;
  readonly limit?: t.Files.Limit;
  readonly defaultLimit: t.Files.Limit;
}): PageResult<T, K> {
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
}

function pageLimit(limit: t.Files.Limit | undefined, defaultLimit: t.Files.Limit): t.Files.Limit {
  const value = limit ?? defaultLimit;
  if (!Num.Is.safeInt(value) || value < 1) throw invalidPath('Invalid Files page limit');
  return value;
}

function offsetFromCursor<K extends t.Files.Cursor.Kind>(
  kind: K,
  cursor: t.Files.String.Cursor<K> | undefined,
): number {
  if (cursor === undefined) return 0;
  const parsed = Files.Cursor.parse(cursor);
  if (!parsed || parsed.kind !== kind) throw invalidPath('Invalid Files cursor');
  const offset = Number.parseInt(parsed.token, 10);
  if (!Num.Is.safeInt(offset) || offset < 0 || String(offset) !== parsed.token) {
    throw invalidPath('Invalid Files cursor token');
  }
  return offset;
}
