import { type t, Process } from './common.ts';

export async function checkVersion(
  cmd: string,
  args: readonly string[] = ['-version'],
): Promise<t.ProbeCheckResult> {
  try {
    const res = await Process.invoke({
      cmd,
      args: [...args],
      silent: true,
    });
    if (res.success) return { ok: true };
    return { ok: false, error: res.text.stderr || res.text.stdout || res.toString() };
  } catch (error) {
    return { ok: false, error };
  }
}
