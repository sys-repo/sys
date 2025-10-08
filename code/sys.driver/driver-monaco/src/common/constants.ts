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

const NULL_RANGE: t.Monaco.I.IRange = {
  startLineNumber: -1,
  startColumn: -1,
  endLineNumber: -1,
  endColumn: -1,
};

export const Severity: Record<NonNullable<t.DiagnosticSeverity>, number> = {
  Hint: 1,
  Info: 2,
  Warning: 4,
  Error: 8,
};

export const DEFAULTS = {
  className: CSS.CLASS.EDITOR,
  languages,
  Severity,
  NULL_RANGE,
} as const;
export const D = DEFAULTS;
