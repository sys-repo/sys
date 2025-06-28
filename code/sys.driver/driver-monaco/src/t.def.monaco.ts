import type { editor } from 'monaco-editor';
import * as monaco from 'monaco-editor';

/**
 * @external
 */
export type { ISelection, Selection } from 'monaco-editor';
export type { monaco };

export type Monaco = typeof monaco;
export type MonacoTextModel = editor.ITextModel;
export type MonacoCodeEditor = editor.IStandaloneCodeEditor;
