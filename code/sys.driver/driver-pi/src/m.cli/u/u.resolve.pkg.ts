import { DenoDeps, Fs, type t } from '../common.ts';

/**
 * Release fallback version, auto-updated from workspace `deps.yaml`.
 * Maintained by `-scripts/-prep.u.ts`; edit the manifest instead.
 */
const PI_AGENT_IMPORT_VERSION = '0.85.1' as const;

export const PI_AGENT_IMPORT_BASE = 'npm:@earendil-works/pi-coding-agent' as const;
export const PI_AGENT_IMPORT = `${PI_AGENT_IMPORT_BASE}@${PI_AGENT_IMPORT_VERSION}` as const;

/**
 * Resolve the Pi package spec from an explicit override or canonical deps file.
 */
export async function resolvePkg(input: {
  readonly cwd: t.StringDir;
  readonly pkg?: t.StringModuleSpecifier;
}) {
  if (input.pkg) return input.pkg;
  const depsPath = await findDepsPath(input.cwd);
  if (!depsPath) return PI_AGENT_IMPORT;

  const res = await DenoDeps.from(depsPath);
  if (res.error) throw res.error;

  return DenoDeps.findImport(res.data?.deps, PI_AGENT_IMPORT_BASE) ?? PI_AGENT_IMPORT;
}

/**
 * Helpers:
 */
async function findDepsPath(cwd: t.StringDir) {
  if (!(await Fs.exists(cwd))) return undefined;
  return await Fs.findAncestor<t.StringPath>(cwd, async ({ dir }) => {
    const path = Fs.join(dir, 'deps.yaml') as t.StringPath;
    return (await Fs.exists(path)) ? path : undefined;
  });
}
