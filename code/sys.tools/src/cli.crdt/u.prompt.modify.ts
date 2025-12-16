import { type t, c, Crdt, Delete, Prompt, Time } from './common.ts';
import { Config } from './u.config.ts';

/**
 * Add a document to the config.
 */
export async function promptAddDocument(
  cwd: t.StringDir,
  opts: { createDoc?: () => Promise<t.Crdt.Id | undefined> } = {},
) {
  const config = await Config.get(cwd);

  let id = await Prompt.Input.prompt({
    message: 'Document ID',
    hint: '↑ blank to create new',
    validate(value) {
      value = value.trim();
      if (!value) return true;
      return Crdt.Is.id(value);
    },
  });

  id = id.trim();
  const create = id === '';

  const name = await Prompt.Input.prompt('Display name (optional)');
  const createdAt = Time.now.timestamp;

  if (create) {
    if (!opts.createDoc) return;

    const createdId = await opts.createDoc();
    if (!createdId) return;

    const next = String(createdId).trim();
    if (!Crdt.Is.id(next)) return;

    id = next;
  }

  const exists = (config.current.docs ?? []).some((d) => d.id === id);
  if (exists) {
    console.info(c.yellow(`\nDocument "${id}" already added`));
    return;
  }

  const entry: t.CrdtTool.ConfigDocumentEntry = Delete.empty({ id, name, createdAt });
  config.change((d) => (d.docs || (d.docs = [])).push(entry));
  await config.fs.save();

  /** Result */
  return { id, name, created: create } as const;
}

/**
 * Remove a document from the config.
 */
export async function promptRemoveDocument(dir: t.StringDir, id: t.StringId) {
  const config = await Config.get(dir);
  const ok = await Prompt.Confirm.prompt('Are you sure?');
  if (!ok) return;

  config.change((d) => (d.docs = (d.docs ?? []).filter((item) => item.id !== id)));
  await config.fs.save();
}
