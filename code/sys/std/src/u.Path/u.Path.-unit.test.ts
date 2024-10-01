import { describe, expect, it } from '../-test.ts';
import { Path } from './mod.ts';

describe('Path', () => {
  it('join', () => {
    expect(Path.join('foo', 'bar')).to.eql('foo/bar');
  });

  it('joinGlobs', () => {
    const res = Path.joinGlobs(['src', '**', '*.ts']);
    expect(res).to.eql('src/**/*.ts');
  });
});
