import { type t, Obj } from './common.ts';

export async function handleSave(doc: t.Crdt.Ref, path: t.ObjectPath, files: t.BinaryFile[]) {
  if (!doc) return;
  doc.change((d) => {
    const target = Obj.Path.Mutate.ensure<t.BinaryFileMap>(d, path, {});


    files.forEach((file) => {
      if (target[file.hash]) {
      } else {
        target[file.hash] = file;
      }
    });
  });
}
