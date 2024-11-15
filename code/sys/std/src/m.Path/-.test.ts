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

  it('absolute', () => {
    expect(Path.absolute('./foo')).to.eql(Path.resolve('./foo'));
    expect(Path.absolute('/foo')).to.eql('/foo');
  });

  describe('Path.Is', () => {
    const Is = Path.Is;

    it('Is.absolute', () => {
      expect(Is.absolute('/foo/bar')).to.eql(true);
      expect(Is.absolute('./foo/bar')).to.eql(false);
    });

    it('Is.relative', () => {
      // NB: the oppsotive of Is.absolute
      expect(Is.relative('/foo/bar')).to.eql(false);
      expect(Is.relative('./foo/bar')).to.eql(true);
    });

    it('Is.glob', () => {
      expect(Is.glob('**/foo.*')).to.eql(true);
      expect(Is.glob('./foo/bar')).to.eql(false);
    });
  });
});
