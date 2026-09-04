/**
 * @module
 */
import { Perf } from '../common/u.perf.ts';
import { DenoFile, Path, type t } from './common.ts';
import { Aliases } from './u.aliases.ts';
import { Log } from './u.log.ts';

/**
 * Configuration helpers for performing module-resolution over a `deno.json` workspace.
 */
export const workspace: t.ViteConfig.Lib['workspace'] = async (options = {}) => {
  const { walkup = true, filter } = options;
  const end = Perf.section('config.workspace', { denofile: options.denofile ?? '', walkup });
  const base = await DenoFile.workspace(options.denofile, { walkup });
  const aliases = await Aliases.list(Path.dirname(base.file), base.children, filter);
  const error = base.exists ? undefined : `Workspace not found${walkup ? '' : ' (walkup=false)'}.`;

  const api: t.ViteDenoWorkspace = {
    ...base,
    filter,
    aliases,
    error,
    toAliasMap() {
      return aliases.reduce<Record<string, t.StringPath>>((acc, alias) => {
        acc[String(alias.find)] = alias.replacement;
        return acc;
      }, {});
    },
    toString: (options) => Log.toString(api, options),
    log: (options) => console.info(api.toString(options)),
  };

  end({
    exists: api.exists,
    aliases: aliases.length,
    children: base.children.length,
    config: api.file,
  });
  return api;
};
