import { type t } from './common.ts';
import { VIDEO } from './VIDEO.index.ts';
import { withThemeMethods } from './u.ts';

export function create() {
  const id: t.Stage = 'Entry';
  const content: t.AppContent = { id };
  return content;
}
