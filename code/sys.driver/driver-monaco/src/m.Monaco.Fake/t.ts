import type { t } from './common.ts';

type StringSourceCode = string;

/**
 * Minimal Monaco-editor test fakes.
 */
export type FakeMonacoLib = Readonly<{
  model(src: StringSourceCode): FakeModel;
  editor(model: t.FakeModel | StringSourceCode): FakeEditor;
}>;

/**
 * Minimal `ITextModel` mock.
 */
export type FakeModel = Pick<
  t.Monaco.TextModel,
  'getValue' | 'setValue' | 'getOffsetAt' | 'onDidChangeContent'
>;

/**
 * Minimal `IStandaloneCodeEditor` fake:
 */
export type FakeEditor = Pick<
  t.Monaco.Editor,
  'getModel' | 'setPosition' | 'onDidChangeCursorPosition'
>;
