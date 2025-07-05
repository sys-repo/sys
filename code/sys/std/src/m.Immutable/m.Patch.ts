import { type t } from './common.ts';

export const Patch: t.ImmutablePatchLib = {
  toObjectPath<P extends { path: string } | string>(input: P) {
    const pointer = typeof input === 'string' ? input : input.path;

    // Root pointer:
    if (pointer === '') return [];

    // Handle lone slash (`'/'`) → empty property on root:
    if (pointer === '/') return [''];

    // RFC-6901 says a JSON-Pointer is either `''` or starts with "/"
    const rawSegments = pointer[0] === '/' ? pointer.slice(1).split('/') : pointer.split('/');

    return rawSegments.map((seg, idx) => {
      // Decode ~escapes & validate:
      if (/~[^01]/.test(seg)) {
        throw new Error(`Invalid JSON-Pointer escape sequence in segment "${seg}".`);
      }
      const decoded = seg.replace(/~1/g, '/').replace(/~0/g, '~');

      // Array-append sentinel "-":
      const isLast = idx === rawSegments.length - 1;
      if (decoded === '-' && isLast) return '-';

      // Numeric coercion:
      if (/^(0|[1-9]\d*)$/.test(decoded)) return Number(decoded) as t.Index;

      // Return as plain string:
      return decoded;
    }) as t.ObjectPath;
  },
};
