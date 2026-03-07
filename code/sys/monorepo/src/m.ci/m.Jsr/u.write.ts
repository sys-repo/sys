import { type t, Fs } from '../common.ts';
import { text } from './u.text.ts';

export async function write(args: t.MonorepoCi.Jsr.WriteArgs) {
  const yaml = await text(args);
  const cwd = args.cwd ?? Deno.cwd();
  const target = Fs.resolve(cwd, args.target);
  await Fs.write(target, yaml);
  return { target, yaml, count: args.paths.length };
}
