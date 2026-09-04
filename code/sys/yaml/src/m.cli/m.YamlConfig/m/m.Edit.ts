import { Fs, type t } from '../common.ts';

export const Edit: t.YamlConfig.Edit.Lib = Object.freeze({
  async update(input) {
    const path = resolveConfigPath(input.cwd, input.config);
    const exists = await Fs.exists(path);
    const created = !exists;
    const doc = exists ? await input.load(path) : await input.initial();
    const mutation = await input.mutate(doc, { path, created });

    if (!mutation.changed) {
      return { kind: 'unchanged', path, created, change: mutation.change };
    }

    const text = input.stringify(mutation.doc);
    await input.validateText(text, path);

    if (input.dryRun === true) {
      return { kind: 'dry-run', path, created, change: mutation.change };
    }

    await Fs.ensureDir(Fs.dirname(path));
    await Fs.write(path, text, { force: true });
    return { kind: 'written', path, created, change: mutation.change };
  },
});

function resolveConfigPath(cwd: t.StringDir, config: string): t.StringPath {
  const value = String(config ?? '').trim();
  if (!value) throw new Error('YamlConfig.Edit: missing required config path.');
  return Fs.resolve(cwd, value) as t.StringPath;
}
