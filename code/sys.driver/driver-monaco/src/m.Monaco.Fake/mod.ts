/**
 * Minimal mock of Monoaco editor.
 * @module
 */
import type { t } from './common.ts';
import { fakeEditor as editor } from './u.editor.ts';
import { fakeModel as model } from './u.model.ts';

export const MonacoFake: t.FakeMonacoLib = {
  model,
  editor,
};
