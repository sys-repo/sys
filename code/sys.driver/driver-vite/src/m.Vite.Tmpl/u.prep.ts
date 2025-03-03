import { type t, Fs, getWorkspaceModules } from './common.ts';

type O = Record<string, string>;

/**
 * Prepare the template with latest state, including making updates to deps/versions.
 */
export const prep: t.ViteTmplLib['prep'] = async () => {
  const { modules } = await getWorkspaceModules();
  const path = './src/-tmpl/imports.json';
  const current = (await Fs.readJson<O>(path)).data;
  const imports = modules.latest(current ?? {});
  await Fs.writeJson(path, imports);
  return { imports };
};
