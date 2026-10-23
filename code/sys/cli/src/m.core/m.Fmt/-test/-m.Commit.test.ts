import { describe, expect, it } from '../../../-test.ts';
import { c, Fmt } from '../../mod.ts';

describe('Cli.Fmt.Commit', () => {
  it('renders the default commit suggestion block', () => {
    const text = Fmt.Commit.suggestion('chore(deps): upgrade workspace dependencies');

    expect(text).to.include(c.bold(c.brightCyan('suggested commit msg:')));
    expect(text).to.include(c.white('chore(deps): upgrade workspace dependencies'));
  });

  it('supports suppressing the title while changing the message color', () => {
    const text = Fmt.Commit.suggestion('chore(ci): refresh generated GitHub workflow outputs', {
      title: false,
      message: { color: 'green' },
    });

    expect(text).to.eql(c.green('chore(ci): refresh generated GitHub workflow outputs'));
  });

  it('supports styling the title line', () => {
    const text = Fmt.Commit.suggestion('chore(workspace): refresh generated graph snapshot', {
      title: { text: 'commit:', color: 'cyan', bold: false },
      message: { color: 'white' },
    });
    const lines = text.split('\n');

    expect(lines[0]).to.eql(c.cyan('commit:'));
    expect(lines[1]).to.eql(c.white('chore(workspace): refresh generated graph snapshot'));
  });

  it('supports indenting the rendered block', () => {
    const text = Fmt.Commit.suggestion('chore(deps): upgrade workspace dependencies', {
      indent: 2,
    });
    const lines = text.split('\n');

    expect(lines.every((line) => line.startsWith('  '))).to.eql(true);
  });

  it('supports bolding the message line when requested', () => {
    const text = Fmt.Commit.suggestion('chore(workspace): prepared submodules', {
      message: { bold: true },
    });

    expect(text).to.include(c.bold(c.white('chore(workspace): prepared submodules')));
  });

  it('supports italic message styling when requested', () => {
    const text = Fmt.Commit.suggestion('chore(ci): refresh generated GitHub workflow outputs', {
      title: false,
      message: { color: 'green', italic: true },
    });

    expect(text).to.eql(c.italic(c.green('chore(ci): refresh generated GitHub workflow outputs')));
  });
});
