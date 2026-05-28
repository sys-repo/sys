import { Cli, describe, expect, it } from '../../-test.ts';
import { WorkspaceBump } from '../mod.ts';

describe(`@sys/workspace/bump Fmt`, () => {
  it('formats invalid release warnings', () => {
    expect(WorkspaceBump.Fmt.invalidRelease('banana')).to.include('argument not supported');
    expect(WorkspaceBump.Fmt.invalidRelease('banana')).to.include('--release=');
  });

  it('formats canonical bump phase labels', () => {
    const a = WorkspaceBump.Fmt.phase({ kind: 'collect' });
    const b = WorkspaceBump.Fmt.phase({ kind: 'followup', followup: 'post-bump prep' });
    const c = WorkspaceBump.Fmt.phase({ kind: 'integrity' });
    expect(a).to.eql('calculating workspace bump plan...');
    expect(b).to.eql('running post-bump prep...');
    expect(c).to.eql('checking non-bumped package integrity...');
  });

  it('keeps bump help within 80 visible columns', () => {
    const text = silentInfo(() => WorkspaceBump.Fmt.help());
    expectMaxVisibleWidth(text, 80);
  });
});

function silentInfo<T>(fn: () => T): T {
  const info = console.info;
  console.info = () => undefined;

  try {
    return fn();
  } finally {
    console.info = info;
  }
}

function expectMaxVisibleWidth(text: string, width: number) {
  const wide = Cli.stripAnsi(text)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > width);
  expect(wide, wide.join('\n')).to.eql([]);
}
