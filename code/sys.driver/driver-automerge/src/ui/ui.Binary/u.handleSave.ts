import { type t, Obj } from './common.ts';

export async function handleSave(doc: t.Crdt.Ref, path: t.ObjectPath, files: t.BinaryFile.File[]) {
  if (!doc) return;
  doc.change((d) => {
    const target = Obj.Path.Mutate.ensure<t.BinaryFile.Map>(d, path, {});
    files.forEach((file) => {
      const hx = file.hash ?? '';
      if (!target[hx]) target[hx] = file;
    });
  });
}
