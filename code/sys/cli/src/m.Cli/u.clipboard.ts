import type { t } from './common.ts';

/**
 * Copy arbitrary text to the system clipboard from a Deno CLI context.
 * Permission: deno run --allow-run=pbcopy (for mac).
 */
export async function copyToClipboard(text: string): Promise<t.CliCopyResult> {
  const bytes = new TextEncoder().encode(text);
  const tried: string[] = [];

  for (const cmd of detectCmd()) {
    tried.push(cmd);
    try {
      const proc = new Deno.Command(cmd, { stdin: 'piped' }).spawn();

      // WritableStream<Uint8Array> → use a writer.
      if (!proc.stdin) throw new Error('stdin not piped');
      const writer = proc.stdin.getWriter();
      await writer.write(bytes);
      await writer.close();

      const { success } = await proc.status;
      if (success) return { ok: true };
    } catch (err: unknown) {
      // Keep trying if the utility isn't present; bail for other errors.
      if (err instanceof Deno.errors.NotFound) continue;
      const error = err instanceof Error ? err : new Error(String(err));
      return { ok: false, error, tried };
    }
  }

  return {
    ok: false,
    error: new Error(`No clipboard utility found (tried ${tried.join(', ')})`),
    tried,
  };
}

/**
 * Helpers:
 */
function detectCmd(): string[] {
  switch (Deno.build.os) {
    case 'darwin':
      return ['pbcopy']; // ← macOS.
    case 'windows':
      return ['clip']; //   ← Windows.
    default:
      return ['xclip', 'xsel']; // Linux (prefers xclip, falls back to xsel).
  }
}
