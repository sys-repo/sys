import { type t } from './common.ts';

export function cleanHexColor(input: t.StringHex) {
  const s = (input || '').trim().replace(/^#/, '').toLowerCase();
  const clean = /^[0-9a-f]{3,8}$/.test(s) ? s : '000000';
  return `#${clean}`;
}
