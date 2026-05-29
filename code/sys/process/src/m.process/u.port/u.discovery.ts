import type { t } from '../common.ts';
import { parseLsof, parseSs } from './u.parse.ts';

/**
 * Discover TCP LISTEN sockets matching a normalized port target.
 */
export async function tcpListeners(target: t.Process.Port.Target) {
  const lsof = await commandOutput('lsof', [
    '-nP',
    `-iTCP:${target.port}`,
    '-sTCP:LISTEN',
    '-Fpcn',
  ]);
  if (lsof) return parseLsof(commandStdout(lsof, target, 'lsof'), target);

  if (Deno.build.os === 'linux') {
    const ss = await commandOutput('ss', ['-H', '-ltnp', 'sport', '=', `:${target.port}`]);
    if (ss) return parseSs(commandStdout(ss, target, 'ss'), target);
  }

  throw new Error('Process.Port: listener discovery requires lsof or ss.');
}

async function commandOutput(command: string, args: readonly string[]) {
  try {
    return await new Deno.Command(command, {
      args: [...args],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
  } catch (cause) {
    if (cause instanceof Deno.errors.NotFound) return undefined;
    throw new Error(`Process.Port: failed to start ${command}.`, { cause });
  }
}

function commandStdout(
  output: Deno.CommandOutput,
  target: t.Process.Port.Target,
  command: string,
) {
  const stdout = new TextDecoder().decode(output.stdout);
  const stderr = new TextDecoder().decode(output.stderr).trim();

  if (!output.success && stdout.trim().length === 0) {
    if (output.code === 1) return '';
    throw new Error(
      `Process.Port: ${command} listener discovery failed for tcp:${target.port}.${
        stderr ? ` ${stderr}` : ''
      }`,
    );
  }

  return stdout;
}
