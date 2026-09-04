import { Fs, type t } from '../common.ts';
import { fileLabel, fileOf } from '../u.fs/u.ts';
import { NAME_REGEX } from './u.constants.ts';
import { defaultMenuPrompts, type MenuPromptDeps } from './u.prompts.ts';

export async function renameConfig(
  path: t.StringFile,
  ext: t.StringPath,
): Promise<t.StringFile | undefined> {
  return await renameConfigWith(path, ext, defaultMenuPrompts());
}

/** Package-internal config rename prompt parameterized by text input. */
export async function renameConfigWith(
  path: t.StringFile,
  ext: t.StringPath,
  prompts: MenuPromptDeps,
): Promise<t.StringFile | undefined> {
  const dir = Fs.dirname(path);
  const name = fileLabel(path, ext);
  const raw = await prompts.text({
    message: 'Config name',
    default: name,
    validate(value) {
      const trimmed = String(value ?? '').trim();
      if (!trimmed) return 'Name required.';
      if (!NAME_REGEX.test(trimmed)) return 'Invalid name.';
      const filename = fileOf(trimmed, ext);
      return Fs.exists(Fs.join(dir, filename)).then((exists) =>
        exists && trimmed !== name ? 'Name already exists.' : true
      );
    },
  });

  const nextName = raw.trim();
  if (nextName === name) return;

  const nextFile = Fs.join(dir, fileOf(nextName, ext));
  await Fs.move(path, nextFile);
  return nextFile;
}
