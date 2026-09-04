import { FALLBACK_TEXT, type t } from '../common.ts';
import { parseBare } from './u.parseBare.ts';

export function fromDataUri(uri: t.StringUri): t.StringMimeType | undefined {
  if (uri.slice(0, 5).toLowerCase() !== 'data:') return undefined;

  const comma = uri.indexOf(',');
  if (comma < 5) return undefined;

  let header = uri.slice(5, comma);
  if (header.toLowerCase().endsWith(';base64')) header = header.slice(0, -7);
  if (!header) return FALLBACK_TEXT;
  if (header.startsWith(';')) header = `${FALLBACK_TEXT}${header}`;

  return parseBare(header);
}
