import { describe, expect, it } from '../../../-test.ts';
import { DenoTask } from '../mod.ts';
import { testProject } from './u.fixture.ts';

describe('DenoTask.list', () => {
  it('includes exact names and glob patterns in deno.json task order', async () => {
    const fs = await testProject({
      'sample:alpha': 'deno --version',
      'dev': 'deno --version',
      'sample:beta': 'deno --version',
    });

    const tasks = await DenoTask.list({
      cwd: fs.dir,
      include: ['dev', 'sample:*'],
    });

    expect(tasks.map((task) => task.name)).to.eql(['sample:alpha', 'dev', 'sample:beta']);
  });

  it('excludes after inclusion and ignores non-string task values', async () => {
    const fs = await testProject({
      'sample:alpha': 'deno --version',
      'sample:skip': 'deno --version',
      'sample:bad': 123,
    });

    const tasks = await DenoTask.list({
      cwd: fs.dir,
      include: ['sample:*'],
      exclude: ['sample:skip'],
    });

    expect(tasks.map((task) => task.name)).to.eql(['sample:alpha']);
  });
});
