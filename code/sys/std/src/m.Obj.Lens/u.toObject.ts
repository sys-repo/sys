import { type t, isPlainObject } from './common.ts';
import { Is } from './m.Is.ts';

export const toObject: t.ObjLensLib['toObject'] = (input, opts = {}) => {
  const { depth = 32, includeGetters = false } = opts;
  const seen = new WeakMap<object, unknown>();

  const visit = (node: unknown, d: number, isRoot = false): unknown => {
    // Bound lens: unwrap even at floor (single step), no recursion when d <= 0.
    if (Is.lensRef(node)) {
      const value = node.get();
      return d <= 0 ? value : visit(value, d - 1, false);
    }

    // Floor guard:
    if (d <= 0) return isRoot ? undefined : undefined;

    // Primitives / functions:
    const tpe = typeof node;
    if (node == null || tpe !== 'object') return node;

    // Cycle guard:
    const cached = seen.get(node as object);
    if (cached) return cached;

    // Arrays:
    if (Array.isArray(node)) {
      const out: unknown[] = [];
      seen.set(node, out);
      for (let i = 0; i < node.length; i++) out[i] = visit(node[i], d - 1, false);
      return out;
    }

    // Unbound lenses: preserve reference as-is.
    if (Is.lens(node)) return node;

    // Plain objects (skip getters unless requested):
    if (isPlainObject(node)) {
      const out: Record<string, unknown> = {};
      seen.set(node, out);
      for (const key of Object.keys(node)) {
        const desc = Object.getOwnPropertyDescriptor(node, key);
        if (!desc) continue;
        if (!includeGetters && typeof desc.get === 'function' && !('value' in desc)) continue;
        out[key] = visit((node as any)[key], d - 1, false);
      }
      return out;
    }

    // Other object instances: return as-is.
    return node;
  };

  return visit(input, depth, true) as any;
};
