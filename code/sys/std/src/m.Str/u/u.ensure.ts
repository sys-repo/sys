import type { t } from '../common.ts';

export const ensureSlashWrapped: t.Str.Lib['ensureSlashWrapped'] = (str = '') => {
  const inner = str.trim().replace(/^\/+|\/+$/g, '');
  return inner ? `/${inner}/` : '/';
};
