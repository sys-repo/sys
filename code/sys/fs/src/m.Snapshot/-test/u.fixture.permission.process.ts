import { c, CliTable, Err, Is, Process } from './common.ts';
import { Fs } from '../../m.Fs/mod.ts';

export type PermissionFixtureMode = 'allowed' | 'denied';
type ReadPermission = '--deny-read' | `--allow-read=${string}`;
type CaptureOutput = Awaited<ReturnType<typeof Process.capture>>;

const EXECUTION_TIMEOUT = 15_000;
const TERMINATION_GRACE = 1_000;
const OUTPUT_LIMIT = 8_192;

/** Run this fixture in a subprocess with one exact read-permission boundary. */
export async function runPermissionFixture(
  permission: ReadPermission,
  mode: PermissionFixtureMode,
  root: string,
  path: string,
) {
  const target = new URL(import.meta.url);
  target.search = new URLSearchParams({ mode, root, path }).toString();

  return await Process.capture({
    args: ['run', '--frozen', '--cached-only', '--no-prompt', permission, target.href],
    cwd: Fs.cwd(),
    executionTimeout: EXECUTION_TIMEOUT,
    terminationGrace: TERMINATION_GRACE,
    maxStdoutBytes: OUTPUT_LIMIT,
    maxStderrBytes: OUTPUT_LIMIT,
  });
}

/** Require a clean fixture process and return its bounded terminal report. */
export function permissionFixtureReport(output: CaptureOutput) {
  if (
    output.outcome !== 'exited' ||
    !output.success ||
    output.code !== 0 ||
    output.stdoutTruncated ||
    output.stderrTruncated ||
    output.text.stderr !== ''
  ) {
    throw new Error(
      output.text.stderr || `Snapshot permission fixture failed with outcome ${output.outcome}.`,
    );
  }
  if (output.text.stdout.length === 0) {
    throw new Error('Snapshot permission fixture returned no report.');
  }
  return output.text.stdout;
}

if (import.meta.main) await main(new URL(import.meta.url));

async function main(url: URL) {
  const input = fixtureInput(url.searchParams);
  const report = input.mode === 'allowed'
    ? await readAllowed(input.root, input.path)
    : await readDenied(input.root, input.path);
  Process.stdout.write(`${report}\n`);
}

function fixtureInput(params: URLSearchParams) {
  const names = [...params.keys()];
  const mode = params.get('mode');
  const root = params.get('root');
  const path = params.get('path');
  if (
    names.length !== 3 ||
    names.some((name) => !['mode', 'root', 'path'].includes(name)) ||
    !(mode === 'allowed' || mode === 'denied') ||
    !Is.str(root) ||
    !Is.str(path)
  ) {
    throw new Error('Invalid snapshot permission fixture input.');
  }
  return { mode, root, path } as const;
}

async function readAllowed(root: string, path: string) {
  let ancestorDenied = false;
  try {
    await Fs.lstat(Fs.dirname(root));
  } catch (cause) {
    if (!Err.Is.error(cause) || !['NotCapable', 'PermissionDenied'].includes(cause.name)) {
      throw cause;
    }
    ancestorDenied = true;
  }
  if (!ancestorDenied) throw new Error('Ancestor read authority was not denied.');

  const result = await Fs.Snapshot.file({ root, path, maxBytes: 4, timeout: 10_000 });
  const table = CliTable.create([]);
  push(table, 'status', c.green('allowed'));
  push(table, 'ancestor read', c.green('denied as required'));
  push(table, 'path', c.cyan(result.path));
  push(table, 'byte length', c.white(String(result.byteLength)));
  push(table, 'evidence', c.cyan(result.evidence));
  push(table, 'bytes', c.white([...result.bytes].join(' ')));
  return `${c.bold(c.white('Fs.Snapshot permission proof'))}\n${table}`;
}

async function readDenied(root: string, path: string) {
  try {
    await Fs.Snapshot.file({ root, path, maxBytes: 4, timeout: 10_000 });
    throw new Error('Snapshot unexpectedly succeeded without read authority.');
  } catch (cause) {
    if (!Fs.Snapshot.Is.failure(cause) || cause.kind !== 'permission-denied') throw cause;
    const table = CliTable.create([]);
    push(table, 'status', c.green('denied as required'));
    push(table, 'failure', c.cyan(cause.kind));
    return `${c.bold(c.white('Fs.Snapshot permission proof'))}\n${table}`;
  }
}

function push(table: ReturnType<typeof CliTable.create>, label: string, value: string) {
  table.push([c.gray(`${label}:`), value]);
}
