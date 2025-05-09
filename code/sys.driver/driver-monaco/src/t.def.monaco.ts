import type * as monaco from 'monaco-editor';

/**
 * @external
 */
export type { ISelection, Selection } from 'monaco-editor';

export type { monaco };
export type MonacoCodeEditor = monaco.editor.IStandaloneCodeEditor;
export type Monaco = typeof monaco;
