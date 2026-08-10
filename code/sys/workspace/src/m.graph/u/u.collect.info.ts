import { Is, Json, Process, type t } from '../common.ts';
import { GraphCli } from '../u.cli/mod.ts';
import { validateInfoJson } from '../u.schema/mod.ts';
import { classifyModuleSpecifier } from './u.moduleSpecifier.ts';

const ERR_PREFIX = 'Workspace.Graph.collect';

export async function collectInfoJson(cwd: t.StringDir, roots: readonly t.StringPath[]) {
  const allRoots: string[] = [];
  const modules: t.WorkspaceGraphCli.InfoModule[] = [];

  for (const root of roots) {
    const command = GraphCli.info({ cwd, root });
    const output = await Process.invoke({ ...command, args: [...command.args], silent: true });
    if (!output.success) {
      const message = output.text.stderr.trim() || output.text.stdout.trim() || 'deno info failed';
      throw new Error(`${ERR_PREFIX}}: ${message}`);
    }

    const info = validateInfoJson(Json.parse(output.text.stdout));
    for (const mod of info.modules ?? []) {
      if (Is.str(mod.error)) {
        if (classifyModuleSpecifier(mod.specifier) === 'opaque-asset') continue;

        const specifier = mod.specifier ?? '<unknown>';
        throw new Error(`${ERR_PREFIX}}: graph error for ${root} at ${specifier}: ${mod.error}`);
      }
      modules.push(mod);
    }
    for (const value of info.roots ?? []) allRoots.push(value);
  }

  return {
    roots: allRoots,
    modules,
  } satisfies t.WorkspaceGraphCli.InfoJson;
}
