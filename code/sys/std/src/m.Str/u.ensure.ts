import type { t } from './common.ts';

export const ensureSlashWrapped: t.StrLib['ensureSlashWrapped'] = (str = '') => {
  const inner = str.trim().replace(/^\/+|\/+$/g, '');
  return inner ? `/${inner}/` : '/';
};
