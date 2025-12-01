import { type t, c, Fs, getConfig, Prompt, Time } from './common.ts';
import { Mime } from './cmd.serve/mod.ts';

/**
 * Add a document to the config.
 */
export async function promptAddServeLocation(cwd: t.StringDir) {
  const config = await getConfig(cwd);

  let path = await Prompt.Input.prompt({
    message: 'Directory (or Enter to use current)',
    async validate(value) {
      const path = value.trim() || cwd;
      const stats = await Fs.stat(path);
      const current = `${!value ? '(current)' : ''}`;
      if (!stats) return `Path does not exist ${current}`;
      if (!stats?.isDirectory) return 'Path is not a directory';

      const alreadyExists = (config.current.dirs ?? []).find((item) => item.dir === path);
      if (alreadyExists) return `Path already added ${current}`;

      return true;
    },
  });
  path = path.trim() || cwd;

  const selectedGroups = await Prompt.Checkbox.prompt({
    message: '\nAllowed MIME-types',
    options: [
      { name: 'images (png, jpeg, webp, svg)', value: 'images', checked: true },
      { name: 'videos (webm, mp4)', value: 'videos', checked: true },
      { name: 'documents (pdf, json, yaml)', value: 'documents', checked: true },
      { name: 'code (js, wasm)', value: 'code', checked: true },
      { name: 'text (txt, html)', value: 'text', checked: true },
    ],
    check: c.green('●'),
    uncheck: c.gray('○'),
  });

  let name = await Prompt.Input.prompt({
    message: 'Display name',
    async validate(value) {
      if (!value.trim()) return 'Must have a display name';
      return true;
    },
  });

  function update(location: Partial<t.ServeDirConfig>): t.ServeDirConfig {
    location.dir = path;
    const types: t.MimeType[] = [];
    const groups = selectedGroups as readonly t.MimeGroup[];

    for (const group of groups) {
      types.push(...Mime.groups[group]);
    }
    location.contentTypes = types;
    location.name = name;

    return location as t.ServeDirConfig;
  }

  config.change((d) => {
    const now = Time.now.timestamp;
    const locations = d.dirs || (d.dirs = []);
    const index = locations.findIndex((item) => item.dir === path);
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
export async function promptRemoveDocument(dir: t.StringDir, location: t.ServeDirConfig) {
  const config = await getConfig(dir);
  const ok = await Prompt.Confirm.prompt('Are you sure? Remove this directory from your config?');
  if (!ok) return;

  config.change((d) => {
    d.dirs = (d.dirs ?? []).filter(({ dir }) => dir !== location.dir);
  });

  await config.fs.save();
}
