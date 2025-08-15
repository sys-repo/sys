import { type t } from './common.ts';

export function asMonaco(fake: t.FakeMonacoGlobal): t.Monaco.Monaco {
  return fake as unknown as t.Monaco.Monaco;
}

export function asEditor(fake: t.FakeEditor): t.Monaco.Editor {
  return fake as unknown as t.Monaco.Editor;
}

export function asModel(fake: t.FakeTextModel): t.Monaco.TextModel {
  return fake as unknown as t.Monaco.TextModel;
}
