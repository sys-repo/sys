import { describe, expect, it } from '../../-test.ts';
import { WorkspaceBump } from '../mod.ts';

describe(`@sys/workspace/bump Fmt`, () => {
  it('formats invalid release warnings', () => {
    expect(WorkspaceBump.Fmt.invalidRelease('banana')).to.include('argument not supported');
    expect(WorkspaceBump.Fmt.invalidRelease('banana')).to.include('--release=');
  });

  it('formats canonical bump phase labels', () => {
    const a = WorkspaceBump.Fmt.phase({ kind: 'collect' });
    const b = WorkspaceBump.Fmt.phase({ kind: 'followup', followup: 'post-bump prep' });
    expect(a).to.eql('calculating workspace bump plan...');
    expect(b).to.eql('running post-bump prep...');
  });
});
