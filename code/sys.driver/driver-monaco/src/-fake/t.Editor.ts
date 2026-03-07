import type { t } from './common.ts';

type StringSourceCode = string;

/**
 * Factory: Create a new editor fake.
 */
export type CreateFakeEditor = (
  model?: t.FakeTextModel | t.Monaco.TextModel | StringSourceCode,
) => t.FakeEditorFull;

/**
 * Minimal `IStandaloneCodeEditor` fake:
 */
export type FakeEditorFull = t.Monaco.Editor & t.FakeEditor;
type UpdateOptionsArg = Parameters<t.Monaco.I.IStandaloneCodeEditor['updateOptions']>[0];
export type FakeEditor = t.EditorHiddenMembers &
  Pick<
    t.Monaco.I.IStandaloneCodeEditor,
    | 'getId'
    | 'getModel'
    | 'setModel'
    | 'getPosition'
    | 'setPosition'
    | 'getVisibleRanges'
    | 'onDidChangeCursorPosition'
    | 'onDidChangeModel'
    | 'onDidChangeConfiguration'
    | 'onKeyDown'
    | 'trigger'
    | 'executeEdits'
    | 'getOption'
    | 'updateOptions'
    | 'revealPositionInCenterIfOutsideViewport'
    | 'revealRangeInCenterIfOutsideViewport'
  > & {
    _emitDidChangeModel: () => void;
    _emitDidChangeConfiguration: () => void;
    _getViewModel: () => { getHiddenAreas: () => t.Monaco.I.IRange[] };
    _getUpdateOptionsCalls: () => readonly UpdateOptionsArg[];
    _setOption: (id: number, value: unknown) => void;
    _fireKeyDown: (args?: {
      key?: string;
      code?: string;
      shiftKey?: boolean;
      altKey?: boolean;
      ctrlKey?: boolean;
      metaKey?: boolean;
    }) => void;
  };
