import { describe, expect, it } from '../../../-test.ts';
import { c, Fmt } from '../../mod.ts';

describe('Cli.Fmt.Path', () => {
  it('renders a gray path with a white basename', () => {
    const path = 'foo/bar/a.ts';

    const inner = Fmt.path(path, Fmt.Path.fmt());
    expect(inner).to.eql(`foo/bar/${c.white('a.ts')}`);

    const res = Fmt.Path.str(path);
    expect(res).to.eql(c.gray(inner));
  });
});
