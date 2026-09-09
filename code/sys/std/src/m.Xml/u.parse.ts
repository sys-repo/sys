import { parse as parseBase } from '@std/xml';
import { D, Err, type t } from './common.ts';

/**
 * Parse XML into a document result without throwing through callers.
 */
export function parse(text: string, options?: t.Xml.ParseOptions): t.Xml.ParseResult {
  try {
    // Facade policy: caller options may tune parsing, but DOCTYPE stays denied last.
    // Good: downstream cannot accidentally widen the XML attack surface.
    const doc = parseBase(text, { ...D.parse, ...options, disallowDoctype: true });
    return { ok: true, doc };
  } catch (error) {
    return { ok: false, error: Err.std(error) };
  }
}
