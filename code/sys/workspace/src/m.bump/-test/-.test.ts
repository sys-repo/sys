import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { WorkspaceBump } from '../mod.ts';

describe(`@sys/workspace/bump`, () => {
  it('API', async () => {
    const m = await import('@sys/workspace/bump');
    expect(m.WorkspaceBump).to.equal(WorkspaceBump);
    expect(m.WorkspaceBump.Args).to.equal(WorkspaceBump.Args);
    expect(m.WorkspaceBump.Fmt).to.equal(WorkspaceBump.Fmt);
  });

  it('formats invalid release warnings', () => {
    expect(WorkspaceBump.Fmt.invalidRelease('banana')).to.include('argument not supported');
    expect(WorkspaceBump.Fmt.invalidRelease('banana')).to.include('--release=');
  });
});
