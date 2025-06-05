import { DenoDeps, DenoFile, Path, Esm } from './libs.ts';

/**
 * Find and load the latest workspace data.
 */
export async function getWorkspaceModules() {
  const ws = await DenoFile.workspace();
  const deps = (await DenoDeps.from(Path.join(ws.dir, 'deps.yaml'))).data;
  const modules = Esm.modules([...(deps?.modules.items ?? []), ...ws.modules.items]);
  return {
    get ws() {
      return ws;
    },
    get modules() {
      return modules;
    },
  } as const;
}
