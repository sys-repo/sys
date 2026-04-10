import { type t, D } from './common.ts';

export function isToolCommand(value: string): value is t.Root.Command {
  return typeof value === 'string' && D.TOOLS.includes(value as t.Root.Command);
}
