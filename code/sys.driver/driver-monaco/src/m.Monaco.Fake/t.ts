import type { t } from './common.ts';

export type * from './t.Editor.ts';
export type * from './t.Model.ts';
export type * from './t.Monaco.ts';

/**
 * Minimal Monaco-editor test fakes.
 */
export type FakeMonacoLib = Readonly<{
  monaco: t.CreateFakeMonaco;
  model: t.CreateFakeTextModel;
  editor: t.CreateFakeEditor;

  // Utilities:
  asMonaco(fake: t.FakeMonacoGlobal): t.Monaco.Monaco;
}>;
