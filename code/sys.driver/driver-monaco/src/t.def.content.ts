import type { t } from './common.ts';

/**
 * Supported languages.
 */
export type EditorLanguage = EditorContent['language'];

/**
 * Editor content.
 */
export type EditorContent =
  | EditorContentYaml
  | EditorContentTypescript
  | EditorContentJavascript
  | EditorContentMarkdown
  | EditorContentJson
  | EditorContentRust
  | EditorContentGo
  | EditorContentPython
  | EditorContentUnknown;

type Common = {
  readonly text: string;
};

export type EditorContentYaml = Common & {
  language: 'yaml';
  parsed?: t.Json;
};

export type EditorContentTypescript = Common & { language: 'typescript' };
export type EditorContentJavascript = Common & { language: 'javascript' };
export type EditorContentMarkdown = Common & { language: 'markdown' };
export type EditorContentJson = Common & { language: 'json' };
export type EditorContentRust = Common & { language: 'rust' };
export type EditorContentGo = Common & { language: 'go' };
export type EditorContentPython = Common & { language: 'python' };
export type EditorContentUnknown = Common & { language: 'UNKNOWN' };
