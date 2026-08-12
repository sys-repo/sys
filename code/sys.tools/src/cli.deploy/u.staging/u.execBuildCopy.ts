import { Fs, Is, Path, Pkg, Process, Str, type t } from '../common.ts';
import { copyInto } from './u.copyInto.ts';
import { ensureIndexHtml } from './u.generateHtml.ts';

type Task = 'test' | 'build';

const OUTPUT_HEAD_CHARS = 8_192;
const OUTPUT_TAIL_CHARS = 49_152;

/**
 * Build a source directory, then copy its /dist output into the staging area.
 */
export async function execBuildCopy(
  cwd: t.StringDir,
  dir: t.DeployTool.Staging.Dir,
  report?: (e: t.DeployTool.Staging.ProgressReport<'mapping:step'>) => void,
  buildResetToken?: string,
): Promise<void> {
  const sourceRaw = String(dir.source ?? '');
  const stagingRaw = String(dir.staging ?? '');

  const srcRoot = Path.Is.absolute(sourceRaw) ? sourceRaw : Path.resolve(cwd, sourceRaw);
  const dst = Path.Is.absolute(stagingRaw) ? stagingRaw : Path.resolve(cwd, stagingRaw);
  const srcDist = Fs.join(srcRoot, 'dist');

  const reportStep = (label: string) => report?.({ kind: 'mapping:step', label });

  reportStep('test');
  await runTask(srcRoot, 'test');

  reportStep('build');
  await runTask(srcRoot, 'build');

  reportStep('sync into staging');
  await copyInto({
    src: srcDist,
    dst,
    // Build outputs should always reflect the latest compile state.
    overwrite: true,
    sync: true,
  });

  reportStep('index.html');
  await ensureIndexHtml(dst, { buildResetToken });

  reportStep('dist.json');
  await Pkg.Dist.compute({ dir: dst, save: true });
}

async function runTask(source: t.StringDir, task: Task) {
  const command = `deno -q task ${task}`;
  let result: t.Process.Output;
  try {
    result = await Process.invoke({
      args: ['-q', 'task', task],
      cwd: source,
      silent: true,
    });
  } catch (cause) {
    throw new Error(`Failed to start ${task} task: ${source}\ncommand: ${command}`, { cause });
  }
  if (result.success) return;

  const output = [
    outputSection('stdout', result.text.stdout),
    outputSection('stderr', result.text.stderr),
  ].filter(Is.string).join('\n\n');
  const signal = result.signal ? `, signal ${result.signal}` : '';
  const message = Str.builder()
    .line(`Failed ${task} task: ${source} (exit ${result.code}${signal})`)
    .line(`command: ${command}`)
    .line(output)
    .toString();
  throw new Error(message);
}

function outputSection(stream: 'stdout' | 'stderr', value: string) {
  const text = Str.trimEdgeNewlines(value);
  if (!text) return;

  const bounded = Str.ellipsize(text, [OUTPUT_HEAD_CHARS, OUTPUT_TAIL_CHARS], {
    ellipsis: '\n… output truncated …\n',
  });
  return `${stream}:\n${bounded}`;
}
