import { type t, Cli, Fs } from '../common.ts';
import { HashFmt } from './u.fmt.ts';

const MB = 1024 * 1024;

export const HashPreflight = {
  D: {
    threshold: {
      files: 100,
      bytes: 50 * MB,
    },
  },

  async scan(targetDir: t.StringDir): Promise<t.HashPreflight> {
    const entries = await Fs.glob(targetDir, { includeDirs: false }).find('**');
    let bytesTotal = 0;
    let fileCount = 0;
    for (const entry of entries) {
      if (!entry.isFile) continue;
      fileCount += 1;
      const stat = await Fs.stat(entry.path);
      bytesTotal += stat?.size ?? 0;
    }
    return { targetDir, fileCount, bytesTotal };
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
} as const;
