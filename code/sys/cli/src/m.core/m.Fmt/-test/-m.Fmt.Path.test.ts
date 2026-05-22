import { describe, expect, it } from '../../../-test.ts';
import { c, Fmt } from '../../mod.ts';

describe('Cli.Fmt.Path', () => {
  it('renders a gray path with a white basename', () => {
    const path = 'foo/bar/a.ts';

    const inner = Fmt.path('./foo/bar/a.ts', Fmt.Path.fmt());
    expect(inner).to.eql(`./foo/bar/${c.white('a.ts')}`);

    const res = Fmt.Path.str(path);
    expect(res).to.eql(c.gray(inner));
  });

  it('prefixes relative display paths with ./', () => {
    expect(Fmt.Path.str('dist')).to.eql(c.gray(`./${c.white('dist')}`));
    expect(Fmt.Path.str('-config/view.yaml')).to.eql(
      c.gray(`./-config/${c.white('view.yaml')}`),
    );
    expect(Fmt.Path.str('./dist')).to.eql(c.gray(`./${c.white('dist')}`));
    expect(Fmt.Path.str('/tmp/dist')).to.eql(c.gray(`/tmp/${c.white('dist')}`));
    expect(Fmt.Path.str('.')).to.eql(c.gray('./'));
  });
});
