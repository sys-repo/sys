import { contentType, type t } from '../common.ts';
import { parseBare } from './u.parseBare.ts';

export function toContentType(mediaType: string): t.StringContentType | undefined {
  return parseBare(mediaType) ? contentType(mediaType) : undefined;
}
