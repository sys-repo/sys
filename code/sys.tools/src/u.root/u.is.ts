import { type t, Is, D } from './common.ts';

export function isToolCommand(value: string): value is t.Root.Command {
  return Is.string(value) && D.TOOLS.includes(value as t.Root.Command);
}
