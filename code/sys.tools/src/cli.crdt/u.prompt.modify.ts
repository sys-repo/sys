import { type t, c, Crdt, Delete, getConfig, Prompt, Time } from './common.ts';

/**
 * Add a document to the config.
 */
export async function promptAddDocument(cwd: t.StringDir) {
  const config = await getConfig(cwd);
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

  const createdAt = Time.now.timestamp;
  const entry: t.CrdtTool.ConfigDocumentEntry = Delete.empty({ id, name, createdAt });
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
