import { type t, PathView } from './common.ts';
import { DevEditor as Editor } from './ui.Dev.Editor.tsx';

export const Dev: t.MonacoDevLib = {
  Editor,
  PathView,
};
