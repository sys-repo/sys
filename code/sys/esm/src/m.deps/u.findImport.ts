import { Esm, type t } from './common.ts';

export function findImport(
  entries: t.EsmDeps.Entry[] | undefined,
  input: t.StringModuleSpecifier,
): t.StringModuleSpecifier | undefined {
  const parsed = Esm.parse(input);
  if (parsed.error) return undefined;

  const found = entries?.find((entry) => {
    return entry.module.registry === parsed.registry && entry.module.name === parsed.name;
  });

  return found?.module.toString();
}
