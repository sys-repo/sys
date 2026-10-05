import { describe, expect, it } from '../../../-test.ts';
import { DenoTask } from '../mod.ts';
import { testProject } from './u.fixture.ts';

describe('DenoTask.run', () => {
  it('runs a declared task through deno task and returns the child status', async () => {
    const fs = await testProject({ 'sample:fail': 'deno eval "Deno.exit(7)"' });
    const res = await DenoTask.run({ cwd: fs.dir, name: 'sample:fail' });

    expect(res.name).to.eql('sample:fail');
    expect(res.output.code).to.eql(7);
    expect(res.output.success).to.eql(false);
  });
});
