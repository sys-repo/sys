import { type t } from './common.ts';

export function defaultLanguageConfig(monaco: t.Monaco.Monaco) {
  monaco.languages.registerCompletionItemProvider('yaml', {
    triggerCharacters: [': '],

    provideCompletionItems(
      model: t.Monaco.TextModel,
      position: t.Monaco.Position,
      context: t.Monaco.Lang.CompletionContext,
      token: t.Monaco.CancellationToken,
    ): t.Monaco.Lang.ProviderResult<t.Monaco.Lang.CompletionList> {
      const word = model.getWordUntilPosition(position);
      const range: t.Monaco.I.IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions: t.Monaco.Lang.CompletionItem[] = [
        {
          label: 'true (yes)',
          kind: monaco.languages.CompletionItemKind.Value,
          insertText: 'true',
          range,
        },
        {
          label: 'false (no)',
          kind: monaco.languages.CompletionItemKind.Value,
          insertText: 'false',
          range,
        },
      ];

      return {
        suggestions,
        incomplete: false, // ← true: re-run provider on further input; false: only filter current suggestions.
      };
    },
  });
}
