const tasks = ['kill:dev', 'kill:serve'] as const;
let exitCode = 0;

for (const task of tasks) {
  const child = new Deno.Command(Deno.execPath(), {
    args: ['task', task],
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  }).spawn();
  const status = await child.status;
  if (!status.success && exitCode === 0) exitCode = status.code || 1;
}

Deno.exit(exitCode);
