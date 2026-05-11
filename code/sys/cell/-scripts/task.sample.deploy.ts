const sampleRoot = './-sample/cell.deploy';

await run([
  'run',
  '-A',
  '@sys/tools',
  'pull',
  '--non-interactive',
  '--config',
  './-config/@sys.tools.pull/view.yaml',
]);

await run([
  'run',
  '-A',
  '@sys/tools',
  'deploy',
  '--non-interactive',
  '--config',
  './-config/@sys.tools.deploy/stage.yaml',
  '--action',
  'stage',
]);

async function run(args: readonly string[]): Promise<void> {
  const child = new Deno.Command(Deno.execPath(), {
    args: [...args],
    cwd: sampleRoot,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  }).spawn();

  const status = await child.status;
  if (!status.success) {
    const code = status.code || 1;
    console.error(`sample:deploy failed (${code}): deno ${args.join(' ')}`);
    Deno.exit(code);
  }
}
