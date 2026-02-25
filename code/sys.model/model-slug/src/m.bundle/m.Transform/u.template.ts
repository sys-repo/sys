import { cleanDocid } from './u.docid.ts';

export function resolveTemplate(value: string, docid: string): string {
  if (!value.includes('<docid>')) return value;
  return value.replaceAll('<docid>', cleanDocid(docid));
}
