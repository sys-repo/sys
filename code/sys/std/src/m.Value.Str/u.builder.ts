import { type t, SPACE } from './common.ts';

export const builder: t.StrLib['builder'] = () => {
  const eol = '\n';
  const chunks: string[] = [];

  const render = () => {
    // Join all chunks once, then strip any trailing whitespace/newlines (preserve internal layout).
    const out = chunks.join('');
    return out.replace(/[ \t\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000\r\n]+$/u, '');
  };

  const api = {
    toString: () => render(),
    line(input: string = SPACE) {
      chunks.push(String(input), eol);
      return api;
    },
  } as const;

  return api;
};
