import { describe, expect, it } from '../../-test.ts';
import { Import } from './mod.ts';

describe('Npm.Import', () => {
  it('specifier( pkg, version ) → package root', () => {
    expect(Import.specifier('react', '19.0.0')).to.eql('npm:react@19.0.0');
  });

  it('specifier( pkg, version, "" ) → same as omitted suffix', () => {
    const a = Import.specifier('react', '19.0.0');
    const b = Import.specifier('react', '19.0.0', '');
    expect(b).to.eql(a);
  });

  it('specifier( pkg, version, suffix ) → appends suffix verbatim', () => {
    expect(Import.specifier('react', '19.0.0', '/jsx-runtime')).to.eql('npm:react@19.0.0/jsx-runtime');
  });
});
