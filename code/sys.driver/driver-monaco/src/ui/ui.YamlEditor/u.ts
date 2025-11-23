import { type t, Obj } from './common.ts';

type P = t.YamlEditorProps;

export function normalizeSourcePath(path: P['path']): t.ObjectPath | undefined {
  if (!path) return;
  if (Obj.Path.Is.path(path)) return path;
  if (Obj.isRecord(path)) return path.source;
  return;
}
