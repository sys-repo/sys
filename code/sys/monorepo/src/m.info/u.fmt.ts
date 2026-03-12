import { Str, c, type t } from './common.ts';

/**
 * Format a monorepo statistics block for console output.
 */
export function fmt(stats: t.MonorepoInfo.StatsResult) {
  return Str.builder()
    .line(`  ${c.yellow('Deno')}.version   ${c.green(stats.runtime.deno)}`)
    .line(`    typescript   ${c.green(stats.runtime.typescript)}`)
    .line(`            v8   ${c.green(stats.runtime.v8)}`)
    .line(c.bold('  ↓'))
    .line(c.yellow('  Monorepo'))
    .line(`${c.dim('  pattern.code  ')} ${c.dim(stats.source.include[0] ?? '')}`)
    .line(`         files   ${c.yellow(stats.files.toLocaleString())}`)
    .line(`         lines   ${c.yellow((stats.lines ?? 0).toLocaleString())}`)
    .toString();
}
