import { get } from './Doc.u.get.ts';
import type { t } from './common.ts';

/**
 * Delete the specified document.
 */
export async function del(args: { repo: t.AutomergeRepo; uri?: t.StringUri; timeout?: t.Msecs }) {
  const { repo, uri, timeout } = args;
  if (!uri) return false;

  const exists = !!(await get({ repo, uri, timeout }));
  if (!exists) return false;

  repo.delete(uri as t.AutomergeUrl);
  return true;
}
