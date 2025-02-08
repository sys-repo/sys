import { type t, Esm, Fs, Path } from './common.ts';
import { isWorkspace, load } from './u.ts';

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

  const children: t.DenoWorkspaceChildren = {
    load: loadChildrenMethod(dir, dirs),
    get dirs() {
      return dirs;
    },
  };

  const specifiers = toModuleSpecifiers(await children.load());
  const modules = Esm.modules(specifiers);
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

function loadChildrenMethod(rootdir: t.StringDir, subpaths: t.StringPath[]) {
  return () => {
    const promises = subpaths
      .map((subpath) => Path.join(rootdir, subpath, 'deno.json'))
      .map((path) => load(path));
    return Promise.all(promises);
  };
}

function toModuleSpecifiers(children: t.DenoFileLoadResponse[]) {
  return children
    .filter((e) => e.ok && !!e.data)
    .filter((e) => !!e.data?.name)
    .map((e) => {
      const data = e.data!;
      const name = data.name ?? '<ERROR>';
      const version = data.version ?? '0.0.0';
      return `jsr:${name}@${version}`;
    });
}
