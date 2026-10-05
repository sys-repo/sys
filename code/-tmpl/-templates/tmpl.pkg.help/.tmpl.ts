import { type t, Fs, TmplEngine } from '../common.ts';

const helpBundleTask = 'deno run -RWE ./src/m.help/-bundle/mod.ts';

type SetupOptions = {
  readonly force?: boolean;
};

/**
 * Validate the target before files are copied.
 */
export async function preflight(dir: t.StringAbsoluteDir, options: SetupOptions = {}) {
  await assertPackageRoot(dir);

  const helpDir = Fs.join(dir, 'src/m.help');
  if (!options.force && await Fs.exists(helpDir)) {
    throw new Error(
      `pkg.help: help resources already exist at ${helpDir}. ` +
        `Use --force only after approving overwrite.`,
    );
  }
}

/**
 * Setup the template (after copy).
 */
export default async function setup(dir: t.StringAbsoluteDir) {
  await assertPackageRoot(dir);
  await updatePackageTypes(dir);
  await updatePackageTasks(dir);
}

/**
 * Helpers:
 */
async function assertPackageRoot(pkgDir: t.StringAbsoluteDir) {
  const required = [
    ['package deno.json', Fs.join(pkgDir, 'deno.json')],
    ['runtime common surface', Fs.join(pkgDir, 'src/common.ts')],
    ['type surface', Fs.join(pkgDir, 'src/types.ts')],
  ] as const;

  const missing: string[] = [];
  for (const [label, path] of required) {
    if (!(await Fs.exists(path))) missing.push(`${label}: ${path}`);
  }

  if (missing.length > 0) {
    throw new Error(
      [`pkg.help: target must be an existing sys package root. Missing:`, ...missing].join('\n- '),
    );
  }
}

async function updatePackageTypes(pkgDir: t.StringAbsoluteDir) {
  const typesFile = Fs.join(pkgDir, 'src/types.ts');
  const exportLine = `export type * from './m.help/t.ts';`;
  await TmplEngine.File.update(typesFile, (line) => {
    if (line.file.lines.includes(exportLine)) return;
    if (!line.is.last) return;

    if (line.text.trim() === 'export type {};') {
      line.modify(exportLine);
    } else {
      line.insert(exportLine, 'after');
    }
  });
}

async function updatePackageTasks(pkgDir: t.StringAbsoluteDir) {
  const denoJson = Fs.join(pkgDir, 'deno.json');
  await TmplEngine.File.updateJson<t.PkgDenoJson>(denoJson, (json) => {
    const tasks = json.tasks ?? {};
    json.tasks = tasks;

    const prep = tasks.prep;
    if (!prep) {
      tasks.prep = 'deno task help:bundle';
    } else if (!prep.includes('help:bundle')) {
      tasks.prep = `${prep} && deno task help:bundle`;
    }

    if (!tasks['help:bundle']) tasks['help:bundle'] = helpBundleTask;
  });
}
