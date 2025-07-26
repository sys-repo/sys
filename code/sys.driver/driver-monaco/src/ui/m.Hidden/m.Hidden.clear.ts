import { type t } from './common.ts';

export const clear: t.EditorHiddenLib['clear'] = (ed) => {
  const editor = ed as t.Monaco.Editor & t.EditorHiddenMembers;
  editor.setHiddenAreas([]);
};
