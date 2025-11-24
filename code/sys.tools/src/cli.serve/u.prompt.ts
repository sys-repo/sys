import { type t, Fs, c, Delete, getConfig, Prompt, Time, D } from './common.ts';

/**
 * Add a document to the config.
 */
export async function promptAddServeLocation(dir: t.StringDir) {
  const config = await getConfig(dir);

  let path = await Prompt.Input.prompt({
    message: 'Serve from directory (or Enter to use current)',
    async validate(value) {
      const path = value.trim() || dir;
      const stats = await Fs.stat(path);
      const current = `${!value ? '(current)' : ''}`;
      if (!stats) return `Path does not exist ${current}`;
      if (!stats?.isDirectory) return 'Path is not a directory';

      const alreadyExists = (config.current.locations ?? []).find((item) => item.dir === path);
      if (alreadyExists) return `Path already added ${current}`;

      return true;
    },
  });
  path = path.trim() || dir;

  const selectedTypes = await Prompt.Checkbox.prompt({
    message: 'File types\n',
    options: [
      { name: 'images (png, jpeg, webp, svg)', value: 'images', checked: true },
      { name: 'videos (webm, mp4)', value: 'video', checked: true },
      { name: 'documents (pdf, json)', value: 'documents', checked: true },
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

  function update(location: Partial<t.ServeConfigLocation>): t.ServeConfigLocation {
    location.dir = path;
    const types = location.types || (location.types = []);
    if (selectedTypes.includes('images')) types.push(...D.mime.images);
    if (selectedTypes.includes('videos')) types.push(...D.mime.videos);
    if (selectedTypes.includes('documents')) types.push(...D.mime.documents);
    location.types = types;
    location.name = name;
    return location as t.ServeConfigLocation;
  }

  config.change((d) => {
    const now = Time.now.timestamp;
    const locations = d.locations || (d.locations = []);
    const index = locations.findIndex((item) => item.dir === path);
    if (index > -1) {
      locations[index].modifiedAt = now;
      update(locations[index]);
    } else {
      locations.push(update({ createdAt: now }));
    }
    d.locations = locations;
  });

  await config.fs.save();
  return { added: true };
}

/**
 * Remove a document from the config.
 */
export async function promptRemoveDocument(dir: t.StringDir, location: t.ServeConfigLocation) {
  const config = await getConfig(dir);
  const ok = await Prompt.Confirm.prompt('Are you sure?');
  if (!ok) return;

  config.change((d) => {
    d.locations = (d.locations ?? []).filter((item) => item.dir !== location.dir);
  });
  await config.fs.save();
}
