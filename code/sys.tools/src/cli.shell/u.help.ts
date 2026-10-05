import { c, D, Fmt } from './common.ts';

/** Render @sys/tools shell help text. */
export async function help(): Promise<string> {
  return await Fmt.help(D.tool.name, {
    summary: 'Shell profile manager: inspect profiles, enable @sys aliases, and update PATH.',
    sections: [
      {
        kind: 'lines',
        label: 'Usage',
        items: [
          `shell <command> [options]`,
        ],
      },
      {
        kind: 'pairs',
        label: 'Commands',
        items: [
          ['doctor', 'diagnose shell, env, PATH, and profile setup (read-only)'],
          ['init', 'initialize the recommended shell baseline'],
          ['alias list', 'show known aliases and where they are enabled'],
          ['alias enable <sys|common>', 'write managed aliases; add --dry-run to preview'],
          ['path list', 'show known PATH entries and where they are present'],
          ['path add deno', 'write Deno bin PATH block; add --dry-run to preview'],
        ],
      },
      {
        kind: 'pairs',
        label: 'Options',
        items: [
          ['--dry-run', 'preview write commands; no files changed'],
          ['--profile <path>', 'target a specific shell profile'],
          ['--shell <zsh|bash|posix>', 'render for a specific shell dialect'],
          ['-h, --help', 'show help'],
        ],
      },
      {
        kind: 'lines',
        label: 'Examples',
        items: [
          c.gray(Fmt.invoke('shell', 'doctor')),
          c.gray(Fmt.invoke('shell', 'init', '--dry-run')),
          c.gray(Fmt.invoke('shell', 'alias', 'list')),
          c.gray(Fmt.invoke('shell', 'alias', 'enable', 'sys', '--dry-run')),
          c.gray(Fmt.invoke('shell', 'path', 'list')),
          c.gray(Fmt.invoke('shell', 'path', 'add', 'deno', '--dry-run')),
        ],
      },
    ],
  });
}
