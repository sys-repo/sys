import { Perf } from '../../common/u.perf.ts';
import { Path, Process, type t } from '../common.ts';

const DENO_BINARY = Deno.build.os === 'windows' ? 'deno.exe' : 'deno';

export async function resolveNpmPath(id: string, cwd: string): Promise<string | null> {
  return await resolveNpmPathWith(id, cwd, { invoke: Process.invoke });
}

export async function resolveNpmPathWith(
  id: string,
  cwd: string,
  deps: t.ResolveDeps,
): Promise<string | null> {
  const end = Perf.section('transport.resolveNpmPath', { id, cwd }, {
    level: 2,
    thresholdMs: 20 as t.Msecs,
  });
  const output = await deps.invoke({
    cmd: DENO_BINARY,
    args: ['eval', 'console.log(import.meta.resolve(Deno.args[0]))', id],
    cwd,
    silent: true,
  });
  if (!output.success) {
    end({ ok: false });
    return null;
  }

  const value = output.text.stdout.trim();
  if (!value.startsWith('file://')) {
    end({ ok: false, fileUrl: false });
    return null;
  }
  const path = Path.fromFileUrl(value);
  end({ ok: true, path });
  return path;
}
