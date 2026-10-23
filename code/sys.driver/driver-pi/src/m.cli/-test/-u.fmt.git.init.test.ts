import { describe, expect, it } from '../../-test.ts';
import { Cli } from '../common.ts';
import { GitInitFmt } from '../u/u.fmt.git.init.ts';

describe('@sys/driver-pi/cli/u.fmt.git.init', () => {
  it('block → renders the locked directory setup copy', () => {
    const width = 80;
    const text = render('/sample/project', width);
    const lines = text.split('\n');

    expect(lines[0]).to.eql('━'.repeat(width - 1));
    expect(lines.at(-1)).to.eql('━'.repeat(width - 1));
    expect(text).to.contain('Agent:Directory Setup · read, write, edit, bash');
    expect(text).to.contain('This directory is not inside a git repository.');
    expect(text).to.contain('Initialize one here to continue.');
    expect(text).to.contain('Target');
    expect(text).to.contain('/sample/project/.git');
    expect(text).to.contain('Adds');
    expect(text).to.contain('• .gitignore');
    expect(text).to.contain('• .gitattributes (Git LFS)');
  });

  it('block → preserves the .git tail on narrow widths without overflowing the frame', () => {
    const width = 44;
    const cwd = '/sample/project-with-a-very-long-directory-name-for-pi-testing';
    const raw = GitInitFmt.block(cwd as never, { width });
    const text = Cli.stripAnsi(raw);
    const lines = text.split('\n');

    expect(text).to.contain('Agent:Directory Setup');
    expect(text).to.contain('.git');
    expect(text).to.contain('..');
    expect(raw).to.contain(Cli.Fmt.omission('..'));
    expect(Math.max(...lines.map((line) => line.length))).to.be.at.most(width - 1);
  });
});

function render(cwd: string, width: number) {
  return Cli.stripAnsi(GitInitFmt.block(cwd as never, { width }));
}
