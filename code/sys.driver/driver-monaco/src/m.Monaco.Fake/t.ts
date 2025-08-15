import type { t } from './common.ts';

export type * from './t.Editor.ts';
export type * from './t.Model.ts';
export type * from './t.Monaco.ts';

type StringSrcCode = string;

/**
 * Minimal Monaco-editor test fakes.
 */
export type FakeMonacoLib = Readonly<{
  monaco: t.CreateFakeMonaco;
  model: t.CreateFakeTextModel;
  editor: t.CreateFakeEditor;

  // Type casting:
  host(model?: t.FakeTextModel | StringSrcCode, monaco?: t.FakeMonacoGlobal): t.MonacoHost;
  asMonaco(fake: t.FakeMonacoGlobal | t.Monaco.Monaco): t.Monaco.Monaco;
  asEditor(fake: t.FakeEditor | t.Monaco.Editor): t.Monaco.Editor;
  asModel(fake: t.FakeTextModel | t.Monaco.TextModel): t.Monaco.TextModel;
}>;
