import type * as t from './t.ts';

export const CSS = {
  CLASS: { EDITOR: `sys-monaco-editor` },
} as const;

const languages: t.EditorLanguage[] = [
  'markdown',
  'typescript',
  'javascript',
  'json',
  'yaml',
  'rust',
  'go',
  'python',
];

const NULL_RANGE: t.EditorRange = {
  startLineNumber: -1,
  startColumn: -1,
  endLineNumber: -1,
  endColumn: -1,
};

export const DEFAULTS = {
  NULL_RANGE,
  className: CSS.CLASS.EDITOR,
  languages,
} as const;
export const D = DEFAULTS;
