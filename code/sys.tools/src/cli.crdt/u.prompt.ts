import { type t, c, Cli, Crdt, D, Fs, Is, Yaml } from './common.ts';
import { CrdtDocsFs } from './u.docs/u.fs.ts';

export async function promptAddDocument(
  cwd: t.StringDir,
  opts: {
    id?: t.StringId;
    name?: t.StringName;
  } = {},
) {
  const { id, name } = opts;
  const res = await Cli.Input.Form.prompt({
    message: '',
    fields: [
      {
        label: 'id',
        initial: id,
        validate: (value) => {
          if (!value) return;
          if (!Crdt.Is.id(value)) return 'Invalid CRDT id.';
        },
      },
      {
        label: 'name',
        initial: name,
      },
    ],
  });

  if (res.cancelled) return;
  const values = res.value ?? {};
  const nextId = values.id?.trim() ?? '';
  if (!Crdt.Is.id(nextId)) return;
  const nextName = values.name?.trim();
  const next = { id: nextId, name: nextName };
  return await CrdtDocsFs.writeDoc(cwd, next);
}

export async function promptRemoveDocument(dir: t.StringDir, id: t.StringId) {
  const ok = await Cli.Input.Confirm.prompt(`Remove "${id}"?`);
  if (!ok) return;
  const path = Fs.join(dir, CrdtDocsFs.fileOf(id));
  if (!(await Fs.exists(path))) return;
  await Fs.remove(path);
}

export async function promptRenameDocument(cwd: t.StringDir, id: t.StringId) {
  const res = await Cli.Input.Form.prompt({
    message: '',
    fields: [
      {
        label: 'id',
        initial: id,
        validate: (value) => {
          if (!value) return;
          if (!Crdt.Is.id(value)) return 'Invalid CRDT id.';
        },
      },
      { label: 'name', initial: '' },
    ],
  });

  if (res.cancelled) return;
  const values = res.value ?? {};
  const next = values.id?.trim();
  if (!Crdt.Is.id(next)) return;
  if (next === id) return;

  const filename = `${next}${CrdtDocsFs.ext}`;
  const path = Fs.join(cwd, CrdtDocsFs.dir, filename);
  const existing = await CrdtDocsFs.readYaml(path);
  if (existing.ok) {
    console.info(c.yellow('Document already exists.'));
    return;
  }

  const prevPath = Fs.join(cwd, CrdtDocsFs.fileOf(id));
  const read = await Fs.readText(prevPath);
  if (!read.ok) return;
  const yaml = Yaml.parse<Crdt.Doc>(read.data);
  if (!yaml.ok || !yaml.data) return;
  yaml.data.id = next;
  const doc = yaml.data as t.Crdt.Doc;
  const nextName = values.name?.trim();
  if (Is.str(nextName) && nextName.length > 0) doc.name = nextName;
  const text = Yaml.stringify(doc).data ?? '';
  await Fs.ensureDir(Fs.dirname(path));
  await Fs.write(path, text);
  await Fs.remove(prevPath);
  console.info(`  ${c.green('Renamed')} document "${Crdt.Id.toUri(next)}".`);
}
