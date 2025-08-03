import { type t, PathView } from './common.ts';
import { DevEditor as Editor } from './ui.DevEditor.tsx';

export const Dev: t.MonacoDevLib = {
  Editor,
  PathView,
};
