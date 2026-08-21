import type { t } from './common.ts';

type RedrawInput = Parameters<t.CliKeyboard.Lib['isRedraw']>[0];

export function isRedraw(event: RedrawInput): boolean {
  return event.key === 'r' && event.ctrlKey === false && event.altKey === false &&
    event.metaKey === false && event.shiftKey === false;
}
