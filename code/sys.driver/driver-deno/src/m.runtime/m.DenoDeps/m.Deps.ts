import { Deps, Err, type t } from './common.ts';

export function findImport(
  deps: t.DenoDeps.Dep[] | undefined,
  input: t.StringModuleSpecifier,
): t.StringModuleSpecifier | undefined {
  return Deps.findImport(deps, input);
}

export const toDep: t.DenoDeps.Lib['toDep'] = (input, options = {}) => {
  return Deps.toEntry(input, options);
};

export const toYaml: t.DenoDeps.Lib['toYaml'] = (deps, options = {}) => {
  return Deps.toYaml(deps, {
    groupBy: options.groupBy
      ? ({ entry, target, group }) => options.groupBy?.({ dep: entry, target, group })
      : undefined,
  });
};

export const from: t.DenoDeps.Lib['from'] = async (input) => {
  const res = await Deps.from(input);
  if (res.error && !res.data) {
    return {
      error: rewriteError(res.error),
    };
  }

  const entries = res.data?.entries ?? [];
  return {
    error: rewriteError(res.error),
    data: res.data && {
      deps: entries,
      modules: res.data.modules,
      toYaml: (options) => toYaml(entries, options),
    },
  };
};

function rewriteError(error?: t.StdError): t.StdError | undefined {
  if (!error) return undefined;
  if (error.message !== 'Dependency manifest data could not be retrieved') return error;
  return Err.std('Imports data could not be retrieved', { cause: error.cause ?? error });
}
