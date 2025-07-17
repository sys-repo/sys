/**
 * Minimal mock of Monoaco editor.
 * @module
 */
import type { t } from './common.ts';
import { fakeEditor as editor } from './m.Fake.editor.ts';
import { fakeModel as model } from './m.Fake.model.ts';

export const MonacoFake: t.FakeMonacoLib = {
  model,
  editor,
};
