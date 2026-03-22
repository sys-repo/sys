import { describe, expect, Fs, it, Testing } from '@sys/testing/server';
import { main, normalizeWorkspace } from '../task.prep.workspace.ts';

describe('scripts/task.prep.workspace', () => {
  it('normalizeWorkspace sorts and dedupes workspace entries while preserving other keys', () => {
    const input = {
      name: '@scope/root',
      workspace: ['code/zeta', 'code/alpha', 'code/alpha', 'deploy/app'],
      tasks: { prep: 'deno task prep' },
    };

    const res = normalizeWorkspace(input);

    expect(res).to.eql({
      name: '@scope/root',
      workspace: ['code/alpha', 'code/zeta', 'deploy/app'],
      tasks: { prep: 'deno task prep' },
    });
    expect(input.workspace).to.eql(['code/zeta', 'code/alpha', 'code/alpha', 'deploy/app']);
  });

  it('main rewrites deno.json when workspace entries are unsorted', async () => {
    const fs = await Testing.dir('scripts.task.prep.workspace.write');
    const path = fs.join('deno.json');
    await Fs.writeJson(path, {
      workspace: ['code/zeta', 'code/alpha', 'code/alpha'],
      lint: { rules: { exclude: ['no-explicit-any'] } },
    });

    const changed = await main(path);
    const after = (await Fs.readJson<{ workspace?: string[] }>(path)).data;

    expect(changed).to.eql(true);
    expect(after?.workspace).to.eql(['code/alpha', 'code/zeta']);
  });

  it('main leaves deno.json unchanged when workspace entries are already normalized', async () => {
    const fs = await Testing.dir('scripts.task.prep.workspace.unchanged');
    const path = fs.join('deno.json');
    await Fs.writeJson(path, {
      workspace: ['code/alpha', 'code/zeta'],
    });

    const changed = await main(path);

    expect(changed).to.eql(false);
  });
});
