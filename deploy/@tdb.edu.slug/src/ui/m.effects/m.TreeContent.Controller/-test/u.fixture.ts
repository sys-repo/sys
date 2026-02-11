import { type t } from '../common.ts';

export function req(id: string, key: string): t.TreeContentController.Request {
  return { id, key };
}
