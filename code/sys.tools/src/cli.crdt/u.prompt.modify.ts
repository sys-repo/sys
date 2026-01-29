import { type t, c, Crdt, Cli, Fs, Time } from './common.ts';
import { Config } from './u.config.ts';
import { CrdtDocsFs } from './u.docs/u.fs.ts';

/**
 * Add a document to the config.
 */
export async function promptAddDocument(
  cwd: t.StringDir,
  opts: { createDoc?: () => Promise<t.Crdt.Id | undefined> } = {},
) {
  let id = await Cli.Input.Text.prompt({
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

  const name = await Cli.Input.Text.prompt('Display name (optional)');
  const createdAt = Time.now.timestamp;

  if (create) {
    if (!opts.createDoc) return;

    const createdId = await opts.createDoc();
    if (!createdId) return;

    const next = String(createdId).trim();
    if (!Crdt.Is.id(next)) return;

    id = next;
  }

  const path = Fs.join(cwd, CrdtDocsFs.fileOf(id));
  const exists = await Fs.exists(path);
  if (exists) {
    console.info(c.yellow(`\nDocument "${id}" already added`));
    return;
  }

  await CrdtDocsFs.writeDoc(path, { id, name });
  await ensureDocConfigEntry(cwd, { id, name, createdAt });

  /** Result */
  return { id, name, created: create } as const;
}

/**
 * Remove a document from the config.
 */
export async function promptRemoveDocument(dir: t.StringDir, id: t.StringId) {
  const ok = await Cli.Input.Confirm.prompt('Are you sure?');
  if (!ok) return;

  const path = Fs.join(dir, CrdtDocsFs.fileOf(id));
  await Fs.remove(path);
  await removeDocConfigEntry(dir, id);
}

async function ensureDocConfigEntry(
  cwd: t.StringDir,
  doc: t.CrdtTool.Config.DocumentEntry,
) {
  const config = await Config.get(cwd);
  const exists = (config.current.docs ?? []).some((d) => d.id === doc.id);
  if (exists) return;
  config.change((d) => (d.docs || (d.docs = [])).push(doc));
  await config.fs.save();
}

async function removeDocConfigEntry(cwd: t.StringDir, id: t.StringId) {
  const config = await Config.get(cwd);
  config.change((d) => (d.docs = (d.docs ?? []).filter((item) => item.id !== id)));
  await config.fs.save();
}
