import { VitePress } from '../m.VitePress/mod.ts';
import { Args } from './common.ts';

/**
 * Scaffold a new project, use the command-line:
 *
 *      deno run -A jsr:@sys/driver-vitepress/init
 */
export async function init(argv: string[]) {
  type A = { srcDir?: string };
  const args = Args.parse<A>(argv);
  const { srcDir } = args;
  await VitePress.Env.update({ srcDir });
}
