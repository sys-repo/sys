import { Args, Is } from './common.ts';

type HelpArgs = {
  help?: boolean | readonly boolean[];
};

/** Shared help detection for workspace test entrypoints. */
export function wantsTestHelp(argv: readonly string[]) {
  const parsed = Args.parse<HelpArgs>(argv.filter((value) => value !== '--'), {
    boolean: ['help'],
    alias: { h: 'help' },
    unknown: () => true,
  });
  const help = parsed.help;
  return Is.array(help) ? help.some((value) => value === true) : help === true;
}
