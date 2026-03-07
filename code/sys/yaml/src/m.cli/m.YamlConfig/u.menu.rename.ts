import { type t, Cli, Fs } from './common.ts';
import { fileLabel, fileOf } from './u.fs.ts';
import { NAME_REGEX } from './u.menu.constants.ts';

export async function renameConfig(
  path: t.StringFile,
  ext: t.StringPath,
): Promise<t.StringFile | undefined> {
  const dir = Fs.dirname(path);
  const name = fileLabel(path, ext);
  const raw = await Cli.Input.Text.prompt({
    message: 'Config name',
    default: name,
    validate(value) {
      const trimmed = String(value ?? '').trim();
      if (!trimmed) return 'Name required.';
      if (!NAME_REGEX.test(trimmed)) return 'Invalid name.';
      const filename = fileOf(trimmed, ext);
      return Fs.exists(Fs.join(dir, filename)).then((exists) =>
        exists && trimmed !== name ? 'Name already exists.' : true,
      );
    },
  });

  const nextName = raw.trim();
  if (nextName === name) return;

  const nextFile = Fs.join(dir, fileOf(nextName, ext));
  await Fs.move(path, nextFile);
  return nextFile;
}
