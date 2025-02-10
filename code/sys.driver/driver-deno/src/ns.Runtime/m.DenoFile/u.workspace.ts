import { type t, Esm, Fs, Path } from './common.ts';
import { load } from './u.load.ts';

/**
 * Determine if the given input is a `deno.json` file
 * that contains a "workspace":[] configuration.
 */
export const isWorkspace: t.DenoFileLib['isWorkspace'] = async (input) => {
  const { exists, data } = await load(input);
  return exists ? Array.isArray(data?.workspace) : false;
};

/**
 * Load a deno workspace.
 * NB: pass nothing to walk up to the nearest ancestor workspace.
 */
export const workspace: t.DenoFileLib['workspace'] = async (path, options = {}) => {
  const { walkup = true } = options;
  const src = await wrangle.workspaceSource(path, walkup);
  const denofile = await load(src);
  const exists = denofile.exists && Array.isArray(denofile.data?.workspace);
  const file = denofile.path;
  const dir = Path.dirname(file);
  const dirs = denofile.data?.workspace ?? [];

  const files = await loadFiles(dir, dirs);
  const modules = Esm.modules(toModuleSpecifiers(files.map((m) => m.file)));
  const children: t.DenoWorkspaceChildren = { files, dirs };

  const api: t.DenoWorkspace = {
    exists,
    dir,
    file,
    children,
    modules,
  };
  return api;
};

/**
 * Helpers
 */
const wrangle = {
  async workspaceSource(src?: t.StringPath, walkup?: boolean) {
    if (typeof src === 'string') return src;
    return walkup ? await findFirstWorkspaceAncestor() : undefined;
  },
} as const;

async function findFirstWorkspaceAncestor() {
  let root: t.StringPath | undefined;
  await Fs.walkUp('.', async (e) => {
    // Look for the existence of the [deno.json] file.
    const files = await e.files();
    const denofile = files.find((e) => e.name === 'deno.json');
    if (!denofile) return;

    // Load the {JSON} and determine if it is a "workspace".
    const { path } = await load(denofile.path);
    if (await isWorkspace(path)) {
      root = path;
      e.stop();
    }
  });

  return root;
}

async function loadFiles(rootdir: t.StringDir, subpaths: t.StringPath[]) {
  const promises = subpaths
    .map((subpath) => Path.join(rootdir, subpath, 'deno.json'))
    .map((path) => load(path));
  return (await Promise.all(promises))
    .map((m): t.DenoWorkspaceChild => ({ file: m.data!, path: m.path }))
    .filter((m) => !!m.file);
}

function toModuleSpecifiers(files: t.DenoFileJson[]) {
  return files
    .filter((file) => !!file.name)
    .map((file) => {
      const name = file.name ?? '<ERROR>';
      const version = file.version ?? '0.0.0';
      return `jsr:${name}@${version}`;
    });
}
