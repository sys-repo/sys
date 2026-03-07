import { type t } from './common.ts';
//
// export const defaultDoc: t.JsonFileLib['default'] = () => ({ '.meta': { createdAt: 0 } });

export const defaultDoc: t.JsonFileLib['default'] = ((seed?: unknown) => {
  const baseMeta: t.JsonFileMeta = { createdAt: 0 };

  // No seed → plain JsonFileDoc
  if (seed === undefined) {
    return { '.meta': baseMeta };
  }

  const input = seed as t.JsonFileSeed<t.JsonFileDoc>;
  const { ['.meta']: meta, ...rest } = input;

  return {
    ...rest,
    '.meta': { ...baseMeta, ...(meta ?? {}) },
  } as t.JsonFileDoc;
}) as t.JsonFileLib['default'];
