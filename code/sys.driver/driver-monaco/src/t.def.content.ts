import type { t } from './common.ts';

/**
 * Supported languages.
 */
export type EditorLanguage = EditorContent['language'];

/**
 * Type of editor content:
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

type Common = { readonly text: string };

/** Editor content: YAML. */
export type EditorContentYaml = Common & { language: 'yaml'; parsed?: t.Json };
/** Editor content: Typescript. */
export type EditorContentTypescript = Common & { language: 'typescript' };
/** Editor content: Javascript. */
export type EditorContentJavascript = Common & { language: 'javascript' };
/** Editor content: Markdown. */
export type EditorContentMarkdown = Common & { language: 'markdown' };
/** Editor content: JSON. */
export type EditorContentJson = Common & { language: 'json' };
/** Editor content: Rust. */
export type EditorContentRust = Common & { language: 'rust' };
/** Editor content: GoLang. */
export type EditorContentGo = Common & { language: 'go' };
/** Editor content: Python. */
export type EditorContentPython = Common & { language: 'python' };
/** Unknown editor content.  */
export type EditorContentUnknown = Common & { language: 'UNKNOWN' };
