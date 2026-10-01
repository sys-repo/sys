import config from '../../deno.json' with { type: 'json' };
import { describe, expect, Fs, it, ROOT } from '../-test.ts';

const tasks: Readonly<Record<string, string>> = config.tasks;
const proofTasks = [
  'test:entry:process',
  'test:candidate',
  'test:build',
  'test:bridge',
  'test:dev',
  'test:config:process',
  'test:graph',
  'test:loader',
  'test:integrity:build',
] as const;

describe('Vite test lanes', () => {
  it('routine CI lane → base only; former runtime coverage stays explicit', async () => {
    expect(tasks.test).to.eql('deno task test:unit');
    expect(tasks['test:proofs']).to.eql(proofTasks.map((name) => `deno task ${name}`).join(' && '));
    expect(tasks.ci).to.include('deno task test:proofs');
    const workflow = (await Fs.readText(ROOT.resolve('.github/workflows/test.linux.yaml'))).data;
    expect(workflow).to.include("if: ${{ matrix.name == '@sys/driver-vite' }}");
    expect(workflow).to.include('deno task test:proofs');
  });

  it('unit exclusions → exact files remain selected by proof tasks', async () => {
    const ignored = (tasks['test:unit'].split('--ignore=')[1] ?? '').split(',').sort();
    const selected = proofTasks.flatMap((name) => paths(tasks[name]));
    expect(ignored).to.have.length(13);
    expect(ignored).to.eql(selected.filter((path) => path.endsWith('.test.ts')).sort());
    for (const path of selected) {
      expect(await Fs.exists(ROOT.resolve('code/sys.driver/driver-vite', path)), path).to.eql(true);
    }
  });

  it('explicit proofs → common invocation without unit exclusions', () => {
    expect(tasks['test:run']).not.to.include('--ignore');
    for (const flag of ['--frozen', '--cached-only', '--no-prompt']) {
      expect(tasks['test:run']).to.include(flag);
    }
    for (const name of [...proofTasks, 'test:dist:pipeline', 'test:external', 'test:integrity']) {
      expect(tasks[name], name).to.include('deno task test:run ');
      expect(tasks[name], name).not.to.include('test:unit');
      expect(tasks[name], name).not.to.include('--ignore');
    }
    expect(tasks['test:proofs']).not.to.include('test:dist:pipeline');
  });
});

function paths(task: string) {
  return task.split(' ').filter((arg) => arg.startsWith('./src/'));
}
