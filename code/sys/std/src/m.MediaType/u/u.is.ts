import type { t } from '../common.ts';
import { parseBare } from './u.parseBare.ts';

const APPLICATION_TEXT_TYPES: ReadonlySet<string> = new Set([
  'application/ecmascript',
  'application/javascript',
  'application/json',
  'application/typescript',
  'application/typescript+jsx',
  'application/x-ecmascript',
  'application/x-javascript',
  'application/x-yaml',
  'application/xml',
  'application/yaml',
]);

export const valid: t.MediaType.Is.Lib['valid'] = (input) => parseBare(input) !== undefined;

export const text: t.MediaType.Is.Lib['text'] = (input) => {
  const mediaType = parseBare(input);
  return mediaType ? isText(mediaType) : false;
};

export const binary: t.MediaType.Is.Lib['binary'] = (input) => {
  const mediaType = parseBare(input);
  return mediaType ? !isText(mediaType) : false;
};

/**
 * Helpers:
 */

function isText(mediaType: t.StringMimeType): boolean {
  const slash = mediaType.indexOf('/');
  const type = mediaType.slice(0, slash);
  const subtype = mediaType.slice(slash + 1);

  if (type === 'text') return true;
  if (APPLICATION_TEXT_TYPES.has(mediaType)) return true;
  return subtype.endsWith('+json') || subtype.endsWith('+xml') || subtype.endsWith('+yaml');
}
