import { type t } from './common.ts';

export const defaultDoc: t.JsonFile.Lib['default'] = ((seed?: unknown) => {
  const baseMeta: t.JsonFile.Meta = { createdAt: 0 };

  // No seed → plain JsonFile.Doc
  if (seed === undefined) {
    return { '.meta': baseMeta };
  }

  const input = seed as t.JsonFile.Seed<t.JsonFile.Doc>;
  const { ['.meta']: meta, ...rest } = input;

  return {
    ...rest,
    '.meta': { ...baseMeta, ...(meta ?? {}) },
  } as t.JsonFile.Doc;
}) as t.JsonFile.Lib['default'];
