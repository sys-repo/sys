import type * as t from './t.ts';

type L = t.EditorLanguage;

const all: L[] = [
  // Languages:
  'plaintext',
  'yaml',
  'markdown',
  'typescript',
  'javascript',
  'rust',
  'go',
  'python',
  'json',
];

export const Languages = { all } as const;
