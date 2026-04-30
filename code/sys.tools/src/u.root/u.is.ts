import { Is } from '@sys/std/is';
import { D, type t } from './common.ts';

export function isToolCommand(value: string): value is t.Root.Command {
  return Is.str(value) && D.TOOLS.includes(value as t.Root.Command);
}
