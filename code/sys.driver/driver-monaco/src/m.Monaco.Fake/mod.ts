/**
 * Minimal mock of Monoaco editor.
 * @module
 */
import type { t } from './common.ts';
import { fakeEditor as editor } from './m.Fake.editor.ts';
import { fakeModel as model } from './m.Fake.model.ts';
import { fakeMonaco as monaco } from './m.Fake.monaco.ts';

export const MonacoFake: t.FakeMonacoLib = {
  monaco,
  model,
  editor,
};
