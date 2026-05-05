import { describe, expect, it } from '../../src/-test.ts';
import {
  pinDriverPiCliSpecifier,
  pinTmplSpecifier,
  prepTargets,
  resolveDriverPiVersion,
  resolveTmplVersion,
  type DenoFileVersionLib,
} from '../-prep.u.ts';

describe('scripts/-prep', () => {
  it('derives sys.tools passthrough prep targets from the canonical root registry', () => {
    const res = prepTargets('/repo');

    expect(res.map((item) => item.file)).to.eql([
      'code/sys.tools/src/cli.tmpl/mod.ts',
      'code/sys.tools/src/cli.pi/mod.ts',
    ]);
    expect(res.map((item) => item.path)).to.eql([
      '/repo/code/sys.tools/src/cli.tmpl/mod.ts',
      '/repo/code/sys.tools/src/cli.pi/mod.ts',
    ]);
    expect(res.map((item) => item.target.upstream.name)).to.eql([
      '@sys/tmpl',
      '@sys/driver-pi',
    ]);
  });

  it('pins TMPL_JSR_SPECIFIER to the target @sys/tmpl version', () => {
    const source = `
const TMPL_JSR_SPECIFIER = 'jsr:@sys/tmpl@0.0.100';
const x = 1;
`;
    const res = pinTmplSpecifier(source, '0.0.256');
    expect(res).to.contain(`const TMPL_JSR_SPECIFIER = 'jsr:@sys/tmpl@0.0.256';`);
  });

  it('pins DRIVER_PI_CLI_JSR_SPECIFIER to the target @sys/driver-pi version', () => {
    const source = `
const DRIVER_PI_CLI_JSR_SPECIFIER = 'jsr:@sys/driver-pi@0.0.1/cli';
const x = 1;
`;
    const res = pinDriverPiCliSpecifier(source, '0.0.256');
    expect(res).to.contain(
      `const DRIVER_PI_CLI_JSR_SPECIFIER = 'jsr:@sys/driver-pi@0.0.256/cli';`,
    );
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

  it('resolveDriverPiVersion reads version from workspace authority', async () => {
    const stub: DenoFileVersionLib = {
      workspaceVersion(name, src) {
        expect(name).to.eql('@sys/driver-pi');
        expect(src).to.eql('/tmp/deno.json');
        return Promise.resolve('0.0.256');
      },
    };

    const version = await resolveDriverPiVersion('/tmp/deno.json', stub);
    expect(version).to.eql('0.0.256');
  });

  it('resolveDriverPiVersion throws when workspace authority is missing', async () => {
    const stub: DenoFileVersionLib = {
      workspaceVersion() {
        return Promise.resolve(undefined);
      },
    };

    try {
      await resolveDriverPiVersion('/tmp/deno.json', stub);
      throw new Error('Expected resolveDriverPiVersion to throw');
    } catch (error) {
      expect((error as Error).message).to.eql(
        'Missing workspace version for package "@sys/driver-pi": /tmp/deno.json',
      );
    }
  });

  it('pinTmplSpecifier throws when marker constant is missing', () => {
    expect(() => pinTmplSpecifier(`const X = 'jsr:@sys/tmpl@0.0.1';`, '0.0.256')).to.throw(
      'Could not locate TMPL_JSR_SPECIFIER constant in code/sys.tools/src/cli.tmpl/mod.ts',
    );
  });

  it('pinDriverPiCliSpecifier throws when marker constant is missing', () => {
    expect(() =>
      pinDriverPiCliSpecifier(`const X = 'jsr:@sys/driver-pi@0.0.1/cli';`, '0.0.256'),
    ).to.throw(
      'Could not locate DRIVER_PI_CLI_JSR_SPECIFIER constant in code/sys.tools/src/cli.pi/mod.ts',
    );
  });
});
