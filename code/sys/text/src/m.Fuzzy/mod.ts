/**
 * @module
 * Tools for working with fuzzy (appropximate) matching on strings of text.
 *
 * @example
 * Perform a fuzzy match.
 *
 * ```ts
 * import { Fuzzy } from '@sys/text/fuzzy';
 *
 * const text = Fuzzy.pattern('hme');
 * const res = text.match('welcome home bubba');
 *
 * expect(res.exists).to.eql(true);
 * expect(res.range).to.eql({ start: 4, end: 12, text: 'ome home' });
 * ```
 */
export { Fuzzy } from './m.Fuzzy.ts';
