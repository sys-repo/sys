import { describe, expect, it } from '../../../-test.ts';
import { ProfileArgs } from '../u.args.ts';

describe(`@sys/driver-pi/cli/Profiles/u.args`, () => {
  it('parse → recognizes wrapper flags and keeps only -- separated Pi args', () => {
    expect(ProfileArgs.parse(['-h'])).to.eql({ help: true, _: [] });
    expect(ProfileArgs.parse(['--help'])).to.eql({ help: true, _: [] });
    expect(ProfileArgs.parse(['--profile', 'canon'])).to.eql({
      help: false,
      profile: 'canon',
      _: [],
    });
    expect(ProfileArgs.parse(['--git-root', 'cwd', '--profile', 'canon'])).to.eql({
      help: false,
      profile: 'canon',
      gitRoot: 'cwd',
      _: [],
    });
    expect(ProfileArgs.parse(['--git-root=cwd', '--profile', 'canon'])).to.eql({
      help: false,
      profile: 'canon',
      gitRoot: 'cwd',
      _: [],
    });
    expect(ProfileArgs.parse(['--git-root', 'none', '--config', './config/default.yaml'])).to.eql({
      help: false,
      config: './config/default.yaml',
      gitRoot: 'none',
      _: [],
    });
    expect(ProfileArgs.parse(['--allow-all', '--profile', 'canon'])).to.eql({
      help: false,
      allowAll: true,
      profile: 'canon',
      _: [],
    });
    expect(ProfileArgs.parse(['--non-interactive', '--profile', 'canon'])).to.eql({
      help: false,
      nonInteractive: true,
      profile: 'canon',
      _: [],
    });
    expect(ProfileArgs.parse(['-A', '--profile', 'canon'])).to.eql({
      help: false,
      allowAll: true,
      profile: 'canon',
      _: [],
    });
    expect(ProfileArgs.parse(['--config', './profiles.yaml', '--', '--allow-all']))
      .to.eql({
        help: false,
        config: './profiles.yaml',
        _: ['--allow-all'],
      });
    expect(ProfileArgs.parse(['--config', './profiles.yaml', '--', '--model']))
      .to.eql({
        help: false,
        config: './profiles.yaml',
        _: ['--model'],
      });
  });

  it('parse → rejects unsupported git root modes', () => {
    expect(() => ProfileArgs.parse(['--git-root', 'elsewhere'])).to.throw(
      'Unsupported --git-root value: elsewhere. Expected one of: walk-up, cwd, none',
    );
  });
});
