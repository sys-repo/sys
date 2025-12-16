import { Mime } from './cmd.serve/mod.ts';
import { type t, Cli, Fs, Str, Time } from './common.ts';
import { Config } from './u.config.ts';

/**
 * Add a document to the config.
 */
export async function promptAddServeLocation(
  cwd: t.StringDir,
  args: { readonly selectMimeTypes?: boolean } = {},
) {
  const config = await Config.get(cwd);
  const selectMimeTypes = args.selectMimeTypes ?? false;

  const resolveAbs = (raw: string): t.StringDir => {
    const v = raw.trim();
    if (!v) return cwd;
    if (v.startsWith('/')) return v as t.StringDir;
    const rel = Str.trimLeadingDotSlash(v);
    return Fs.join(cwd, rel) as t.StringDir;
  };

  const path = await Cli.Input.Text.prompt({
    message: 'Directory',
    hint: 'Enter to use current',
    async validate(value) {
      const abs = resolveAbs(value);
      const stats = await Fs.stat(abs);
      const current = `${!value ? '(current)' : ''}`;
      if (!stats) return `Path does not exist ${current}`;
      if (!stats?.isDirectory) return 'Path is not a directory';

      // Prevent duplicates by absolute identity (handles rel vs abs).
      const alreadyExists = (config.current.dirs ?? []).find((item) => {
        const existingAbs = Config.resolveDir(cwd, item.dir);
        return existingAbs === abs;
      });
      if (alreadyExists) return `Path already added ${current}`;

      return true;
    },
  });

  const absPath = resolveAbs(path);
  const storedPath = Config.toStoredDir(cwd, absPath);

  const selectedGroups: readonly t.ServeTool.MimeGroup[] = selectMimeTypes
    ? ((await Cli.Input.Checkbox.prompt({
        message: '\nAllowed MIME-types',
        options: [
          { name: 'images (png, jpeg, webp, svg)', value: 'images', checked: true },
          { name: 'videos (webm, mp4)', value: 'videos', checked: true },
          { name: 'documents (pdf, json, yaml)', value: 'documents', checked: true },
          { name: 'code (js, wasm)', value: 'code', checked: true },
          { name: 'text (txt, html)', value: 'text', checked: true },
        ],
      })) as readonly t.ServeTool.MimeGroup[])
    : (Object.keys(Mime.groups) as readonly t.ServeTool.MimeGroup[]);

  const name = await Cli.Input.Text.prompt({
    message: 'Display name',
    async validate(value) {
      if (!value.trim()) return 'Must have a display name';
      return true;
    },
  });

  function update(location: Partial<t.ServeTool.Config.Dir>): t.ServeTool.Config.Dir {
    location.dir = storedPath;

    const types: t.ServeTool.MimeType[] = [];
    for (const group of selectedGroups) types.push(...Mime.groups[group]);

    location.contentTypes = types;
    location.name = name;
    return location as t.ServeTool.Config.Dir;
  }

  config.change((d) => {
    const now = Time.now.timestamp;
    const { locations, index } = Config.Mutate.getLocation(d, cwd, storedPath);
    if (index > -1) {
      locations[index].modifiedAt = now;
      update(locations[index]);
    } else {
      locations.push(update({ createdAt: now }));
    }
    d.dirs = locations;
  });

  await config.fs.save();
  return { added: true };
}

/**
 * Remove a document from the config.
 */
export async function promptRemoveDocument(dir: t.StringDir, location: t.ServeTool.Config.Dir) {
  const config = await Config.get(dir);
  const ok = await Cli.Input.Confirm.prompt({
    message: 'Remove from your config?',
    hint: 'Are you sure?',
  });
  if (!ok) return;

  config.change((d) => {
    d.dirs = (d.dirs ?? []).filter(({ dir }) => dir !== location.dir);
  });

  await config.fs.save();
}
