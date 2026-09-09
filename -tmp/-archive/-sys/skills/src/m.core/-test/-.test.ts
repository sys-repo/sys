import { describe, expect, it } from '../../-test.ts';
import { SkillsCore } from '../mod.ts';

describe(`@sys/skills/core`, () => {
  it('API', async () => {
    const m = await import('@sys/skills/core');
    expect(m.SkillsCore).to.equal(SkillsCore);
  });
});
