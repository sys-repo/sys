import {
  type t,
  DenoFile,
  Err,
  Fs,
  TmplEngine,
  findNearestTypesFile,
  relativeFromFileDir,
} from '../common.ts';

/**
 * Setup the template (after copy):
 */
export default async function setup(dir: t.StringAbsoluteDir) {
  await updateTypesFile(dir);
}

/**
 * Updates the nearest `types.ts` file to include a reference to this module's `t.ts`.
 */
export async function updateTypesFile(dir: t.StringAbsoluteDir) {
  type T = { error?: t.StdError };
  const done = (err?: string): T => {
    const error = err ? Err.std(err) : undefined;
    if (error) console.warn(error);
    return { error };
  };

  // Find the nearest package root (deno.json) - optional, but keeps the behavior aligned.
  const denoPath = await DenoFile.Path.nearest(dir); // string | undefined
  const pkgDir = denoPath ? Fs.dirname(denoPath) : undefined;
  if (!pkgDir) return done(`Failed to find containing package (deno.json) for module at: ${dir}`);

  // Find the nearest types.ts upward from the new module's directory.
  const typesFile = await findNearestTypesFile(dir);
  if (!typesFile) return done(`No parent types.ts found for module: ${dir}`);

  // Compute the relative path from that types.ts to this module's t.ts
  const targetT = Fs.join(dir, 't.ts');
  const rel = relativeFromFileDir(typesFile, targetT);
  const exportLine = `export type * from './${rel}';`;

  const before = await Fs.readText(typesFile);
  if (before.error) return done(before.error.message);

  if ((before.data ?? '').trim() === '') {
    const write = await Fs.write(typesFile, `${exportLine}\n`, { force: true });
    if (write.error) return done(write.error.message);
    return done();
  }

  const update = await TmplEngine.File.update(typesFile, (line) => {
    if (line.file.lines.includes(exportLine)) return;

    const lastExportIndex = line.file.lines.findLastIndex(isTypeStarExportLine);
    if (lastExportIndex >= 0) {
      if (line.index === lastExportIndex) line.insert(exportLine, 'after');
      return;
    }

    if (!line.is.last) return;

    if (line.text.trim() === 'export type {};') {
      line.modify(exportLine);
    } else {
      line.insert(exportLine, 'after');
    }
  });
  if (update.error) return done(update.error.message);

  return done();
}

function isTypeStarExportLine(text: string) {
  return /^export\s+type\s+\*\s+from\s+['"].+['"];?\s*$/.test(text);
}
