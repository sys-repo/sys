type PatchOp =
  | { op: 'add'; path: string; value: unknown }
  | { op: 'replace'; path: string; value: unknown }
  | { op: 'remove'; path: string };

export function applyJsonPatch<T>(input: T, ops: readonly PatchOp[]): T {
  let acc: unknown = clone(input);
  for (const op of ops) {
    acc = apply(acc, op);
  }
  return acc as T;
}

function apply(target: unknown, op: PatchOp): unknown {
  const root = clone(target);
  const path = toSegments(op.path);

  if (path.length === 0) {
    // Root replace:
    if (op.op === 'remove') return undefined;
    if (op.op === 'add' || op.op === 'replace') return clone(op.value);
  }

  const { parent, key } = descend(root, path);
  if (parent === undefined) throw new Error(`Invalid path: ${op.path}`);

  if (Array.isArray(parent)) {
    if (op.op === 'remove') {
      if (key === '-') throw new Error(`"-" not valid for remove: ${op.path}`);
      parent.splice(assertIndex(key), 1);
      return root;
    }
    if (op.op === 'add') {
      if (key === '-') {
        parent.push(clone(op.value));
      } else {
        parent.splice(assertIndex(key), 0, clone(op.value));
      }
      return root;
    }
    if (op.op === 'replace') {
      parent[assertIndex(key)] = clone(op.value);
      return root;
    }
  } else if (isObject(parent)) {
    if (op.op === 'remove') {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (parent as Record<string, unknown>)[assertKey(key)];
      return root;
    }
    if (op.op === 'add' || op.op === 'replace') {
      (parent as Record<string, unknown>)[assertKey(key)] = clone(op.value);
      return root;
    }
  }

  throw new Error(`Unsupported operation at path: ${op.path}`);
}

/**
 * JSON-Pointer helpers (RFC-6901)
 */
function toSegments(pointer: string): (string | number)[] {
  if (pointer === '') return [];
  if (pointer[0] !== '/') return pointer.split('/').map(decodeSeg);
  return pointer.slice(1).split('/').map(decodeSeg);
}

function decodeSeg(seg: string): string | number {
  const s = seg.replace(/~1/g, '/').replace(/~0/g, '~');
  if (/^(0|[1-9]\d*)$/.test(s)) return Number(s);
  return s;
}

/**
 * Walk down to parent of final segment.
 */
function descend(root: unknown, path: (string | number)[]) {
  let curr = root as any;
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i] as any;
    if (Array.isArray(curr)) {
      curr = curr[assertIndex(k)];
    } else if (isObject(curr)) {
      curr = (curr as Record<string, unknown>)[assertKey(k)];
    } else {
      return { parent: undefined as any, key: undefined as any };
    }
  }
  const key = path[path.length - 1];
  return { parent: curr, key };
}

/**
 * Tiny utils
 */
function clone<T>(v: T): T {
  if (v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map(clone) as unknown as T;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(v as Record<string, unknown>)) out[k] = clone((v as any)[k]);
  return out as T;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function assertIndex(k: string | number): number {
  if (typeof k === 'number') return k;
  const n = Number(k);
  if (!Number.isInteger(n)) throw new Error(`Expected array index, got "${String(k)}"`);
  return n;
}

function assertKey(k: string | number): string {
  if (typeof k === 'string') return k;
  throw new Error(`Expected object key, got index "${k}"`);
}
