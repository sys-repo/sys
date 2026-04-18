import { describe, expect, it } from '@sys/testing/server';
import { tmplPrepArgs } from '../task.prep.ts';

describe('scripts/task.prep', () => {
  it('prepares the template repo against published package authorities', () => {
    expect(tmplPrepArgs('prep')).to.eql([
      'run',
      '-P=prep',
      './-scripts/task.prep.ts',
      '--version-source=published',
      '--commit-context=tmpl',
    ]);
  });

  it('preserves bump commit context while still using published package authorities', () => {
    expect(tmplPrepArgs('bump')).to.eql([
      'run',
      '-P=prep',
      './-scripts/task.prep.ts',
      '--version-source=published',
      '--commit-context=bump',
    ]);
  });
});
