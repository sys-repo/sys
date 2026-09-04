import { type t } from './common.ts';

export function asMonaco(fake: t.MonacoFake.Global.Shape): t.Monaco.Monaco {
  return fake as unknown as t.Monaco.Monaco;
}

export function asEditor(fake: t.MonacoFake.Editor.Shape): t.Monaco.Editor {
  return fake as unknown as t.Monaco.Editor;
}

export function asModel(fake: t.MonacoFake.Model.Shape): t.Monaco.TextModel {
  return fake as unknown as t.Monaco.TextModel;
}
