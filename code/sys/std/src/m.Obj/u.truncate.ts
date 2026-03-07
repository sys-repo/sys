import type { t } from './common.ts';
import { R, isRecord } from './common.ts';
import { walk } from './u.walk.ts';

/**
 * Walk the tree and ensure all strings are less than the given max-length.
 */
export const truncateStrings: t.ObjLib['truncateStrings'] = (
  obj?: unknown,
  options?: t.ObjTruncateStringsOptions | number,
) => {
  if (obj == null) return undefined;

  // Options:
  const opt: t.ObjTruncateStringsOptions =
    typeof options === 'number' ? { maxLength: options } : (options ?? {});
  const { ellipsis = true, mutate = false, maxDepth } = opt;
  const max = opt.maxLength ?? 35;

  // `maxDepth`:
  // - undefined → no depth limit (default / current behavior).
  // - 0         → only adjust the root object/array (no deep walk).
  // - 1+        → traverse nested objects/arrays up to that depth.
  const depthLimit = typeof maxDepth === 'number' && maxDepth >= 0 ? maxDepth : undefined;

  // Choose subject (clone unless mutate):
  const subject: unknown = mutate ? obj : R.clone(obj as object);

  // Adjust root (shallow):
  if (Array.isArray(subject)) adjustArray(subject, max, ellipsis);
  else if (isRecord(subject)) adjustObject(subject, max, ellipsis);

  // Deep walk:
  if (depthLimit !== 0) {
    walk(subject as object, (e) => {
      const v = e.value;

      if (depthLimit != null) {
        const path = (e as { path?: readonly (string | number)[] }).path;
        const depth = Array.isArray(path) ? path.length : 0;

        // Respect the maximum nesting depth for container traversal.
        if (depth > depthLimit) return;
      }

      if (Array.isArray(v)) adjustArray(v, max, ellipsis);
      else if (isRecord(v)) adjustObject(v, max, ellipsis);
    });
  }

  return subject as any;
};

/**
 * Helpers:
 */
const trimString = (s: string, max: number, ellipsis: boolean) => {
  if (s.length <= max) return s;
  return ellipsis ? s.slice(0, max) + '...' : s.slice(0, max);
};

const adjustObject = (o: Record<string, unknown>, max: number, ellipsis: boolean) => {
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'string') o[k] = trimString(v, max, ellipsis);
  }
};

const adjustArray = (arr: unknown[], max: number, ellipsis: boolean) => {
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (typeof v === 'string') arr[i] = trimString(v, max, ellipsis);
  }
};
