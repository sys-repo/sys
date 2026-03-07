import type { t } from './common.ts';

/**
 * Library: helpers for working with RFC-6902 JSON patch standard.
 * https://tools.ietf.org/html/rfc6902
 */
export type ImmutableRfc6902PatchLib = {
  /**
   * Convert an RFC-6901 JSON-Pointer (taken from a JSON-Patch operation or a raw
   * string) into an {@link t.ObjectPath}.
   *
   * Notes:
   *  • Root pointer (`''`) → `[]`
   *  • Lone slash (`'/'`)   → [''] (empty-property of root)
   *  • Decodes `~0` ⇢ `~`, `~1` ⇢ `/` (throws on invalid `~x`)
   *  • Numeric segments become **numbers** *only* when the token is exactly `0` | [1-9][0-9]* (no leading zeros, minus signs, or decimals)
   *  • `'-'` is preserved **only** when it is the *terminal* segment of the pointer (array-append sentinel). Else it is treated as a plain string.
   *  • Empty reference tokens between slashes ­­­(`'/foo//bar'`) are preserved as `''`.
   *
   * @example
   *    toPath('/foo/0/bar/42')            // ['foo', 0, 'bar', 42]
   *    toPath('/a~1b')                    // ['a/b']
   *    toPath('/c~0d')                    // ['c~d']
   *    toPath('/items/-')                 // ['items', '-']
   *    toPath('/')                        // ['']
   *    toPath('/foo//bar')                // ['foo', '', 'bar']
   */
  toObjectPath(path: string): t.ObjectPath;
};
