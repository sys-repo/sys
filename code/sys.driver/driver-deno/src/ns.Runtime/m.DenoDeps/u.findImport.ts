import { Esm, type t } from './common.ts';

export function findImport(
  deps: t.Dep[] | undefined,
  input: t.StringModuleSpecifier,
): t.StringModuleSpecifier | undefined {
  const parsed = Esm.parse(input);
  if (parsed.error) return undefined;

  const found = deps?.find((dep) => {
    return dep.module.registry === parsed.registry && dep.module.name === parsed.name;
  });

  return found?.module.toString();
}
