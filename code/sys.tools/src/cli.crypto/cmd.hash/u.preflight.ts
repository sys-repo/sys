import { type t, c, Cli, Fs } from '../common.ts';
import { HashFmt } from './u.fmt.ts';

const MB = 1024 * 1024;

export const HashPreflight = {
  D: {
    threshold: {
      files: 100,
      bytes: 50 * MB,
    },
    junk: [
      {
        kind: '.DS_Store',
        label: '.DS_Store',
      },
    ] as const,
  },

  async scan(targetDir: t.StringDir): Promise<t.HashPreflight> {
    const entries = await Fs.glob(targetDir, { includeDirs: false }).find('**');
    let bytesTotal = 0;
    let fileCount = 0;
    const junkMap = new Map<string, t.StringPath[]>();
    for (const entry of entries) {
      if (!entry.isFile) continue;
      fileCount += 1;
      const stat = await Fs.stat(entry.path);
      bytesTotal += stat?.size ?? 0;
      const kind = HashPreflight.D.junk.find((item) => item.kind === Fs.basename(entry.path));
      if (kind) {
        const files = junkMap.get(kind.kind) ?? [];
        files.push(entry.path);
        junkMap.set(kind.kind, files);
      }
    }
    const junk = HashPreflight.D.junk
      .map((item) => ({ kind: item.kind, label: item.label, files: junkMap.get(item.kind) ?? [] }))
      .filter((item) => item.files.length > 0);
    return { targetDir, fileCount, bytesTotal, junkFiles: junk.flatMap((item) => item.files), junk };
  },

  shouldConfirm(summary: t.HashPreflight) {
    const { files, bytes } = HashPreflight.D.threshold;
    return summary.fileCount > files || summary.bytesTotal > bytes;
  },

  isInteractive() {
    return Deno.stdin.isTerminal() && Deno.stdout.isTerminal();
  },

  async confirmContinue(summary: t.HashPreflight): Promise<boolean> {
    return await Cli.Input.Confirm.prompt({
      message: `${HashFmt.preflightWarning(summary)}. Continue?`,
      default: true,
    });
  },

  async promptCleanup(
    summary: t.HashPreflight,
    prompt: typeof Cli.Input.Checkbox.prompt<string> = Cli.Input.Checkbox.prompt<string>,
  ): Promise<readonly string[]> {
    if (summary.junk.length === 0) return [];
    const options = summary.junk.map((item) => ({
      name: `${item.label} ${c.dim(`(${item.files.length.toLocaleString()} files)`)}`,
      value: item.kind,
    }));
    return (await prompt({
      message: 'Delete before calculating',
      options,
      maxRows: Math.min(10, options.length),
    })) ?? [];
  },

  async deleteSelected(summary: t.HashPreflight, kinds: readonly string[]): Promise<number> {
    const selected = new Set(kinds);
    let count = 0;
    for (const item of summary.junk) {
      if (!selected.has(item.kind)) continue;
      for (const path of item.files) {
        const removed = await Fs.remove(path);
        if (removed) count += 1;
      }
    }
    return count;
  },
} as const;
