import { describe, expect, it } from '../../src/-test.ts';
import { pinTmplSpecifier, resolveTmplVersion, type DenoFileVersionLib } from '../-prep.u.ts';

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

  it('resolveTmplVersion reads version from workspace authority', async () => {
    const stub: DenoFileVersionLib = {
      workspaceVersion(name, src) {
        expect(name).to.eql('@sys/tmpl');
        expect(src).to.eql('/tmp/deno.json');
        return Promise.resolve('0.0.256');
      },
    };

    const version = await resolveTmplVersion('/tmp/deno.json', stub);
    expect(version).to.eql('0.0.256');
  });

  it('resolveTmplVersion throws when workspace authority is missing', async () => {
    const stub: DenoFileVersionLib = {
      workspaceVersion() {
        return Promise.resolve(undefined);
      },
    };

    try {
      await resolveTmplVersion('/tmp/deno.json', stub);
      throw new Error('Expected resolveTmplVersion to throw');
    } catch (error) {
      expect((error as Error).message).to.eql('Missing workspace version for package "@sys/tmpl": /tmp/deno.json');
    }
  });

  it('pinTmplSpecifier throws when marker constant is missing', () => {
    expect(() => pinTmplSpecifier(`const X = 'jsr:@sys/tmpl@0.0.1';`, '0.0.256')).to.throw(
      'Could not locate TMPL_JSR_SPECIFIER constant in cli.tmpl/m.cli.ts',
    );
  });
});
