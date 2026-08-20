import { Fs, Is, Json, Process, type t } from './task.start.gui.preview.common.ts';

type DenoInfoOutput = Readonly<{
  outcome: t.Process.CaptureOutput['outcome'];
  success: boolean;
  text: Readonly<{ stdout: string; stderr: string }>;
}>;

export type PreviewDenoInfoDependencies = Readonly<{
  getEnv(name: 'DENO_DIR'): string | undefined;
  capture(input: t.Process.CaptureArgs): Promise<DenoInfoOutput>;
}>;

const DEFAULT_DEPS: PreviewDenoInfoDependencies = Object.freeze({
  getEnv: (name) => Deno.env.get(name),
  capture: Process.capture,
});

/**
 * Resolve Deno's effective cache directory before crossing a cleared environment boundary.
 * The trusted runtime owns default and platform-specific cache selection; children receive only
 * the resulting explicit DENO_DIR authority.
 */
export async function resolvePreviewDenoDir(
  cwd: string,
  deps: PreviewDenoInfoDependencies = DEFAULT_DEPS,
): Promise<t.StringAbsoluteDir> {
  const configured = asAbsoluteDir(deps.getEnv('DENO_DIR'));
  if (configured) return configured;

  const output = await deps.capture({
    cmd: Deno.execPath(),
    args: ['info', '--json'],
    cwd,
    clearEnv: false,
    env: { FORCE_COLOR: '0' },
    timeoutMs: 10_000 as t.Msecs,
    maxStdoutBytes: 64 * 1024,
    maxStderrBytes: 64 * 1024,
  });
  if (output.outcome !== 'exited' || !output.success) {
    const diagnostic = output.text.stderr.trim() || output.text.stdout.trim();
    const suffix = diagnostic ? `\n${diagnostic}` : '';
    throw new Error(`start:gui:preview Deno cache authority query failed.${suffix}`);
  }

  const parsed = Json.safeParse<unknown>(output.text.stdout);
  const denoDir = asAbsoluteDir(
    parsed.ok && Is.record<Record<string, unknown>>(parsed.data) ? parsed.data.denoDir : undefined,
  );
  if (!denoDir) {
    throw new Error('start:gui:preview Deno cache authority unavailable.');
  }

  return denoDir;
}

function asAbsoluteDir(input: unknown): t.StringAbsoluteDir | undefined {
  if (!Is.string(input) || input.length === 0 || input.includes('\0')) return;
  return Fs.Path.Is.absolute(input) ? input as t.StringAbsoluteDir : undefined;
}
