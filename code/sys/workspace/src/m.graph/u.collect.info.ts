import { type t, Json, Process } from './common.ts';
import { GraphCli } from './u.cli/mod.ts';
import { validateInfoJson } from './u.schema/mod.ts';

export async function collectInfoJson(cwd: t.StringDir, roots: readonly t.StringPath[]) {
  const allRoots: string[] = [];
  const modules: t.WorkspaceGraphCli.InfoModule[] = [];

  for (const root of roots) {
    const command = GraphCli.info({ cwd, root });
    const output = await Process.invoke({ ...command, args: [...command.args], silent: true });
    if (!output.success) {
      const message = output.text.stderr.trim() || output.text.stdout.trim() || 'deno info failed';
      throw new Error(`Workspace.Graph.collect: ${message}`);
    }

    const info = validateInfoJson(Json.parse(output.text.stdout));
    for (const value of info.roots ?? []) allRoots.push(value);
    for (const mod of info.modules ?? []) modules.push(mod);
  }

  return { roots: allRoots, modules } satisfies t.WorkspaceGraphCli.InfoJson;
}
