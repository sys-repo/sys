import type { t } from '../common.ts';

export function isQuit(event: t.CliKeyboardEvent): boolean {
  const key = event.key?.toLowerCase();
  return key === 'q' || (key === 'c' && event.ctrlKey === true);
}
