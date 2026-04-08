import { DenoDeps, type t } from './common.ts';

export const PI_CODING_AGENT_IMPORT = 'npm:@mariozechner/pi-coding-agent' as const;

/**
 * Resolve the Pi package spec from an explicit override or canonical deps file.
 */
export async function resolvePkg(input: {
  readonly pkg?: t.StringModuleSpecifier;
  readonly depsPath?: t.StringPath;
}) {
  if (input.pkg) return input.pkg;
  if (!input.depsPath) return PI_CODING_AGENT_IMPORT;

  const res = await DenoDeps.from(input.depsPath);
  if (res.error) throw res.error;

  return DenoDeps.findImport(res.data?.deps, PI_CODING_AGENT_IMPORT) ?? PI_CODING_AGENT_IMPORT;
}
