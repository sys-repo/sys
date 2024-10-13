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
    it('Is.absolute', () => {
      expect(Path.Is.absolute('/foo/bar')).to.eql(true);
      expect(Path.Is.absolute('./foo/bar')).to.eql(false);
    });

    it('Is.glob', () => {
      expect(Path.Is.glob('**/foo.*')).to.eql(true);
      expect(Path.Is.glob('./foo/bar')).to.eql(false);
    });
  });
});
