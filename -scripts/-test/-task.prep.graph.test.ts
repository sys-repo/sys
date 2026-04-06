import { describe, expect, Fs, it, Testing } from '@sys/testing/server';
import { main } from '../task.prep.graph.ts';

describe('scripts/task.prep.graph', () => {
  it('prints a commit suggestion when the workspace graph snapshot changes', async () => {
    const fs = await Testing.dir('scripts.task.prep.graph.changed');
    await writeWorkspace(fs.dir);

    const logs = await captureInfo(() => main(fs.dir));
    const output = logs.join('\n');

    expect(output).to.include('done:');
    expect(output).to.include('./deno.graph.json');
    expect(output).to.match(
      /chore\(workspace\): refresh generated workspace graph snapshot \(1 node, [^)]+\)/,
    );
  });

  it('omits the commit suggestion when the workspace graph snapshot is unchanged', async () => {
    const fs = await Testing.dir('scripts.task.prep.graph.unchanged');
    await writeWorkspace(fs.dir);
    await captureInfo(() => main(fs.dir));

    const logs = await captureInfo(() => main(fs.dir));
    const output = logs.join('\n');

    expect(output).to.include('done:');
    expect(output).to.include('./deno.graph.json');
    expect(output).to.not.include('chore(workspace): refresh generated workspace graph snapshot');
  });
});

async function writeWorkspace(cwd: string) {
  await Fs.writeJson(Fs.join(cwd, 'deno.json'), {
    workspace: ['code/pkg-a'],
  });

  await Fs.writeJson(Fs.join(cwd, 'code/pkg-a/deno.json'), {
    name: '@scope/a',
    version: '1.0.0',
    exports: { '.': './src/mod.ts' },
  });
  await Fs.write(Fs.join(cwd, 'code/pkg-a/src/mod.ts'), `export const a = 'a';\n`);
}

async function captureInfo(fn: () => Promise<unknown>) {
  const info = console.info;
  const logs: string[] = [];
  console.info = (...args: unknown[]) => logs.push(args.map(String).join(' '));

  try {
    await fn();
  } finally {
    console.info = info;
  }

  return logs;
}
