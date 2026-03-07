import { type t } from './common.ts';

export const Token = {
  get rules() {
    return rules;
  },
  palette: {
    fg: 'F8F8F2',
    comment: '7F848E',

    yellow: 'E6DB74', // strings
    purple: 'AE81FF', // numbers

    cyan: '66D9EF', // canonical "blue"/cyan
    pink: 'F92672', // (keep around if you want it later)
    lime: 'A6E22E', // identifiers

    docComment: '82A1AC',
  },
} as const;

const palette = Token.palette;
const rules: t.Monaco.I.IStandaloneThemeData['rules'] = [
  { token: '', foreground: palette.fg },

  // comments
  { token: 'comment', foreground: palette.comment },
  { token: 'comment.ts', foreground: palette.comment },
  { token: 'comment.doc.ts', foreground: palette.docComment, fontStyle: 'italic' },

  // strings / numbers
  { token: 'string', foreground: palette.yellow },
  { token: 'string.ts', foreground: palette.yellow },
  { token: 'number', foreground: palette.purple },
  { token: 'number.ts', foreground: palette.purple },
  { token: 'regexp', foreground: palette.yellow },
  { token: 'regexp.ts', foreground: palette.yellow },

  // keywords + types
  { token: 'keyword', foreground: palette.pink },
  { token: 'keyword.ts', foreground: palette.pink },
  { token: 'type.identifier', foreground: palette.cyan },
  { token: 'type.identifier.ts', foreground: palette.cyan },
  { token: 'type.identifier.yaml', foreground: palette.cyan },

  // everything else (identifiers / props / funcs) → lime
  { token: 'identifier', foreground: palette.lime },
  { token: 'identifier.ts', foreground: palette.lime },

  // punctuation
  { token: 'delimiter', foreground: palette.fg },
  { token: 'delimiter.ts', foreground: palette.fg },
  { token: 'delimiter.bracket.ts', foreground: palette.fg },
  { token: 'delimiter.parenthesis.ts', foreground: palette.fg },
  { token: 'delimiter.angle.ts', foreground: palette.fg },
  { token: 'delimiter.array', foreground: palette.fg },
  { token: 'delimiter.array.ts', foreground: palette.fg },
];
