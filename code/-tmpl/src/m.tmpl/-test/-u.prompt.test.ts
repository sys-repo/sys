import { describe, expect, it, c } from '../../-test.ts';
import { label } from '../u.prompt.ts';

describe('m.tmpl/u.prompt', () => {
  const make = c.dim(c.gray('make:'));

  it('formats repo as repo (workspace) without changing the template key', () => {
    expect(label('repo')).to.eql(`${make} repo (workspace)`);
  });

  it('keeps non-repo template labels unchanged', () => {
    expect(label('pkg')).to.eql(`${make} pkg`);
    expect(label('m.mod')).to.eql(`${make} m.mod`);
    expect(label('m.mod.ui.controller')).to.eql(`${make} m.mod.ui.controller`);
  });

  it('keeps run labels for task-style entries', () => {
    expect(label('@sys/foo')).to.eql('run:   @sys/foo');
  });
});
