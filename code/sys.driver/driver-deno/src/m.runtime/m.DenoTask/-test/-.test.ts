import { describe, expect, it } from '../../../-test.ts';
import { list } from '../m.list.ts';
import { Menu } from '../m.Menu/mod.ts';
import { run } from '../m.run.ts';
import { DenoTask } from '../mod.ts';

describe('DenoTask', () => {
  it('API', async () => {
    const m = await import('@sys/driver-deno/runtime');
    expect(m.DenoTask).to.equal(DenoTask);
    expect(DenoTask.list).to.equal(list);
    expect(DenoTask.run).to.equal(run);
    expect(DenoTask.Menu).to.equal(Menu);
  });
});
