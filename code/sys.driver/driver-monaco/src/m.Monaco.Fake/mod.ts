/**
 * Minimal fake/mocks of Monoaco editor.
 * @module
 */
import type { t } from './common.ts';
import { fakeEditor as editor } from './m.Fake.editor.ts';
import { fakeModel as model } from './m.Fake.model.ts';
import { fakeMonaco as monaco } from './m.Fake.monaco.ts';
import { asEditor, asModel, asMonaco } from './u.as.ts';
import { host } from './u.ts';

export const MonacoFake: t.FakeMonacoLib = {
  monaco,
  model,
  editor,

  // Type casting:
  host,
  asMonaco,
  asEditor,
  asModel,
};
