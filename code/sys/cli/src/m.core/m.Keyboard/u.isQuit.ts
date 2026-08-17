import type { t } from './common.ts';

export function isQuit(event: t.CliKeyboard.Event): boolean {
  const key = event.key?.toLowerCase();
  return key === 'q' || (key === 'c' && event.ctrlKey === true);
}
