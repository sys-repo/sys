import { describe, expect, it } from '../../../-test.ts';
import { ProfileArgs } from '../u.args.ts';

describe(`@sys/driver-agent/pi/cli/Profiles/u.args`, () => {
  it('parse → recognizes wrapper flags and keeps only -- separated Pi args', () => {
    expect(ProfileArgs.parse(['-h'])).to.eql({ help: true, _: [] });
    expect(ProfileArgs.parse(['--help'])).to.eql({ help: true, _: [] });
    expect(
      ProfileArgs.parse(['--config', './profiles.yaml', '--profile', 'work', '--', '--model']),
    )
      .to.eql({
        help: false,
        config: './profiles.yaml',
        profile: 'work',
        _: ['--model'],
      });
  });
});
