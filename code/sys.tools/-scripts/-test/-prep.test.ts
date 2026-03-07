import { describe, expect, it } from '../../src/-test.ts';
import { assertVersion, pinTmplSpecifier } from '../-prep.u.ts';

describe('scripts/-prep', () => {
  it('pins TMPL_JSR_SPECIFIER to the target @sys/tmpl version', () => {
    const source = `
const TMPL_JSR_SPECIFIER = 'jsr:@sys/tmpl@0.0.100';
const x = 1;
`;
    const res = pinTmplSpecifier(source, '0.0.256');
    expect(res).to.contain(`const TMPL_JSR_SPECIFIER = 'jsr:@sys/tmpl@0.0.256';`);
  });

  it('pinTmplSpecifier is idempotent when already pinned to target version', () => {
    const source = `
const TMPL_JSR_SPECIFIER = 'jsr:@sys/tmpl@0.0.256';
`;
    const res = pinTmplSpecifier(source, '0.0.256');
    expect(res).to.eql(source);
  });

  it('assertVersion reads version from deno.json-like data', () => {
    const version = assertVersion({ version: '0.0.256' }, '/tmp/deno.json');
    expect(version).to.eql('0.0.256');
  });

  it('pinTmplSpecifier throws when marker constant is missing', () => {
    expect(() => pinTmplSpecifier(`const X = 'jsr:@sys/tmpl@0.0.1';`, '0.0.256')).to.throw(
      'Could not locate TMPL_JSR_SPECIFIER constant in cli.tmpl/m.cli.ts',
    );
  });
});
