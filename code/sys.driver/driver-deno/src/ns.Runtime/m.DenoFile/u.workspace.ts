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

  let _modules: t.EsmModules | undefined; // NB: lazy-load.
  const children = await loadFiles(dir, dirs);

  const api: t.DenoWorkspace = {
    exists,
    dir,
    file,
    children,
    get modules() {
      return _modules || (_modules = Esm.modules(toSpecifiers(children.map((m) => m.denofile))));
    },
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

async function loadFiles(root: t.StringDir, subpaths: t.StringPath[]) {
  const trimPath = (path: t.StringPath) => path.slice(root.length + 1);
  const promises = subpaths
    .map((subpath) => Path.join(root, subpath, 'deno.json'))
    .map((path) => load(path));

  const toChild = (path: t.StringPath, denofile: t.DenoFileJson): t.DenoWorkspaceChild => {
    const dir = Path.dirname(path);
    return {
      path: { dir, denofile: path },
      pkg: { name: denofile.name ?? '<Unnamed>', version: denofile.version ?? '0.0.0' },
      denofile,
    };
  };

  return (await Promise.all(promises))
    .filter((m) => !!m.data)
    .map((m) => toChild(trimPath(m.path), m.data!));
}

function toSpecifiers(files: t.DenoFileJson[]): t.StringModuleSpecifier[] {
  return files
    .filter((file) => !!file.name)
    .map((file) => {
      const name = file.name ?? '<ERROR>';
      const version = file.version ?? '0.0.0';
      return `jsr:${name}@${version}`;
    });
}
