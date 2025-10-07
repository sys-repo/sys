import type { t } from './common.ts';

export type * from './t.Editor.ts';
export type * from './t.Model.ts';
export type * from './t.Monaco.ts';
export type * from './t.Spy.ts';

type StringSourceCode = string;

/**
 * Minimal Monaco-editor test fakes.
 */
export type FakeMonacoLib = {
  readonly Spy: t.SpyLib;

  monaco: t.CreateFakeMonaco;
  model: t.CreateFakeTextModel;
  editor: t.CreateFakeEditor;

  // Type casting:
  ctx(model?: t.FakeTextModel | StringSourceCode, monaco?: t.FakeMonacoGlobal): t.MonacoCtx;
  asMonaco(fake: t.FakeMonacoGlobal | t.Monaco.Monaco): t.Monaco.Monaco;
  asEditor(fake: t.FakeEditor | t.Monaco.Editor): t.Monaco.Editor;
  asModel(fake: t.FakeTextModel | t.Monaco.TextModel): t.Monaco.TextModel;
};
