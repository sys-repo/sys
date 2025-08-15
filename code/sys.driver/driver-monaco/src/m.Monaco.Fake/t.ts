import type { t } from './common.ts';

export type * from './t.Editor.ts';
export type * from './t.Model.ts';
export type * from './t.Monaco.ts';

/**
 * Minimal Monaco-editor test fakes.
 */
export type FakeMonacoLib = Readonly<{
  model: t.CreateFakeTextModel;
  editor: t.CreateFakeEditor;
}>;
