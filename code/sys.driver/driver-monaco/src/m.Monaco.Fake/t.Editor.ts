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
export type FakeEditor = t.EditorHiddenMembers &
  Pick<
    t.Monaco.I.IStandaloneCodeEditor,
    | 'getModel'
    | 'getPosition'
    | 'setPosition'
    | 'getVisibleRanges'
    | 'onDidChangeCursorPosition'
    | 'trigger'
    | 'executeEdits'
    | 'revealPositionInCenterIfOutsideViewport'
    | 'revealRangeInCenterIfOutsideViewport'
  >;
