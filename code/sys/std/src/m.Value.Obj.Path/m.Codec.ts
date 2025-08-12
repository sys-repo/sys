import type { t } from './common.ts';

const pointer: t.ObjectPathCodec = {
  name: 'pointer',
  encode(path) {
    if (path.length === 0) return '';
    const esc = (s: string) => s.replace(/~/g, '~0').replace(/\//g, '~1');
    return '/' + path.map((k) => esc(String(k))).join('/');
  },
  decode(text) {
    if (text === '') return [];
    if (!text.startsWith('/'))
      throw new Error('Invalid JSON Pointer: must start with "/" or be "".');
    const unesc = (s: string) => s.replace(/~1/g, '/').replace(/~0/g, '~');
    return text
      .slice(1)
      .split('/')
      .map((t) => unesc(t)); // ← strings only
  },
};

const dot: t.ObjectPathCodec = {
  name: 'dot',
  encode(path) {
    if (path.length === 0) return '';
    const esc = (s: string) => s.replace(/([.\\[\]])/g, '\\$1');
    const parts: string[] = [];
    for (const seg of path) {
      if (typeof seg === 'number') {
        parts.push(`[${seg}]`);
      } else if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(seg)) {
        parts.push(parts.length ? '.' + seg : seg);
      } else {
        parts.push((parts.length ? '.' : '') + esc(seg));
      }
    }
    return parts.join('');
  },
  decode(text) {
    if (text === '') return [];
    const out: (string | number)[] = [];
    let i = 0;
    let buf = '';

    const flushIdent = () => {
      if (buf.length) {
        out.push(buf);
        buf = '';
      }
    };

    while (i < text.length) {
      const ch = text[i];

      if (ch === '\\') {
        const next = text[++i];
        if (next === undefined) throw new Error('Invalid escape at end of path.');
        buf += next;
        i++;
        continue;
      }

      if (ch === '.') {
        flushIdent();
        i++;
        continue;
      }

      if (ch === '[') {
        flushIdent();
        i++;
        const end = text.indexOf(']', i);
        if (end === -1) throw new Error('Unclosed bracket in path.');
        const tok = text.slice(i, end);
        out.push(toIndexOrKey(tok));
        i = end + 1;
        continue;
      }

      buf += ch;
      i++;
    }
    flushIdent();
    return out;
  },
};

export const Codec: t.ObjectPathCodecLib = {
  default: pointer,
  pointer,
  dot,
} as const;

/**
 * Helpers:
 */
const isIntegerString = (s: string) => /^[0-9]+$/.test(s);
const toIndexOrKey = (s: string): string | number => (isIntegerString(s) ? Number(s) : s);
