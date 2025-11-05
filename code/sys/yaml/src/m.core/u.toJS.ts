import type * as Y from 'yaml';
import { type t } from './common.ts';

export const toJS: t.YamlLib['toJS'] = (doc) => {
  try {
    return {
      ok: true,
      data: (doc as Y.Document.Parsed).toJS(),
      errors: [],
    };
  } catch (err) {
    const msg = String((err as any)?.message ?? 'YAML toJS error');
    const code = /alias/i.test(msg) ? 'yaml.alias.unresolved' : 'yaml.tojs.error';
    return { ok: false, errors: [{ message: msg, code }] };
  }
};
