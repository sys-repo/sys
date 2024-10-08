import { Fs, type t } from '../common.ts';

/**
 * `deno.json` file tools.
 */
export const Denofile: t.DenofileLib = {
  /**
   * Load a `deno.json` file at the given file path.
   */
  async load(path) {
    path = Fs.resolve(path ?? './deno.json');
    if (await Fs.Is.dir(path)) path = Fs.join(path, 'deno.json');
    return Fs.readJson<t.DenofileJson>(path);
  },

  /**
   * Load a deno workspace.
   * NB: pass nothing to walk up to the nearest ancestor workspace.
   */
  async workspace(path, options = {}) {
    const { walkup = true } = options;
    const src = await wrangle.workspaceSource(path, walkup);
    const file = await Denofile.load(src);
    const exists = file.exists && Array.isArray(file.json?.workspace);
    const paths = file.json?.workspace ?? [];
    return { exists, path: file.path, paths };
  },

  /**
   * Determine if the given input is a `deno.json` file
   * that contains a "workspace":[] configuration.
   */
  async isWorkspace(input) {
    const { exists, json } = await Denofile.load(input);
    return exists ? Array.isArray(json?.workspace) : false;
  },
};

/**
 * Helpers
 */
const wrangle = {
  async workspaceSource(src?: t.StringPath, walkup?: boolean) {
    if (typeof src === 'string') return src;
    return walkup ? await findFirstAncestorWorkspace() : undefined;
  },
} as const;

async function findFirstAncestorWorkspace() {
  let root: t.StringPath | undefined;
  await Fs.walkUp('.', async (e) => {
    // Look for the existence of the [deno.json] file.
    const files = await e.files();
    const denofile = files.find((e) => e.name === 'deno.json');
    if (!denofile) return;

    // Load the {JSON} and determine if it is a "workspace".
    const { path } = await Denofile.load(denofile.path);
    if (await Denofile.isWorkspace(path)) {
      root = path;
      e.stop();
    }
  });

  return root;
}
