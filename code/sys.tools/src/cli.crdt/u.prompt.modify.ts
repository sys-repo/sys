import { type t, c, Crdt, Delete, getConfig, Prompt } from './common.ts';

/**
 * Add a document to the config.
 */
export async function promptAddDocument(dir: t.StringDir) {
  const config = await getConfig(dir);
  let id = await Prompt.Input.prompt({
    message: 'Document-id',
    validate: (value) => Crdt.Is.id(value.trim()),
  });
  id = id.trim();

  const name = await Prompt.Input.prompt('Display name (optional)');
  const exists = (config.current.docs ?? []).some((d) => d.id === id);
  if (exists) {
    console.info(c.yellow(`\nDocument "${id}" already added`));
    return;
  }

  const entry: t.CrdtConfigDocEntry = Delete.empty({ id, name });
  config.change((d) => (d.docs || (d.docs = [])).push(entry));
  await config.fs.save();

  return { id, name } as const;
}

/**
 * Remove a document from the config.
 */
export async function promptRemoveDocument(dir: t.StringDir, id: t.StringId) {
  const config = await getConfig(dir);
  const ok = await Prompt.Confirm.prompt('Are you sure?');
  if (!ok) return;

  config.change((d) => (d.docs = (d.docs ?? []).filter((item) => item.id !== id)));
  await config.fs.save();
}
