import { Deps, type t, Err } from './common.ts';

export function findImport(
  deps: t.Dep[] | undefined,
  input: t.StringModuleSpecifier,
): t.StringModuleSpecifier | undefined {
  return Deps.findImport(deps, input);
}

export const toDep: t.DepsLib['toDep'] = (input, options = {}) => {
  return Deps.toEntry(input, options);
};

export const toYaml: t.DepsLib['toYaml'] = (deps, options = {}) => {
  return Deps.toYaml(deps, {
    groupBy: options.groupBy
      ? ({ entry, target, group }) => options.groupBy?.({ dep: entry, target, group })
      : undefined,
  });
};

export const from: t.DepsLib['from'] = async (input) => {
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
