import { D, Fmt } from './common.ts';

/** Render @sys/tools shell help text. */
export async function help(): Promise<string> {
  return await Fmt.help(D.tool.name, {
    usage: [
      `shell doctor`,
      `shell alias list`,
      `shell alias enable <sys|common> --dry-run`,
      `shell path list`,
      `shell path add deno --dry-run`,
      `shell apply --dry-run`,
      `shell apply`,
    ],
    options: [
      ['--dry-run', 'Preview alias/PATH changes without writing.'],
      ['--profile <path>', 'Plan/apply against an explicit profile path.'],
      ['--shell <zsh|bash|posix>', 'Override detected shell dialect for rendering.'],
      ['-h, --help', 'Show help.'],
    ],
    examples: [
      `${Fmt.invoke('shell', 'doctor')}`,
      `${Fmt.invoke('shell', 'alias', 'list')}`,
      `${Fmt.invoke('shell', 'alias', 'enable', 'sys', '--dry-run')}`,
      `${Fmt.invoke('shell', 'path', 'list')}`,
      `${Fmt.invoke('shell', 'path', 'add', 'deno', '--dry-run')}`,
      `${Fmt.invoke('shell', 'apply', '--dry-run')}`,
      `${Fmt.invoke('shell', 'apply')}`,
    ],
  });
}
