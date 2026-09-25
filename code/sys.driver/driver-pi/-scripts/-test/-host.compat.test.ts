import { PI_AGENT_IMPORT_BASE } from '../../src/m.cli/u/u.resolve.pkg.ts';
import { describe, expect, Fs, it } from '../common.ts';
import { isolateHostArgs, selectHost } from '../-test.external/u.host.compat.ts';

const CANONICAL = `${PI_AGENT_IMPORT_BASE}@1.2.3`;

describe('Pi: isolated host proof inputs', () => {
  it('dependency authority → default selection; one exact release → explicit override', () => {
    expect(selectHost([], CANONICAL)).to.eql({ pkg: CANONICAL, version: '1.2.3', explicit: false });
    expect(selectHost(['--pi-version=2.3.4'], CANONICAL)).to.eql({
      pkg: `${PI_AGENT_IMPORT_BASE}@2.3.4`,
      version: '2.3.4',
      explicit: true,
    });
  });

  it('moving tags, custom imports, positional and repeated selections → rejected', () => {
    for (const value of ['latest', '^1.2.3', '1.2', '../local.ts', '1.2.3/subpath', '01.2.3']) {
      expect(() => selectHost([`--pi-version=${value}`], CANONICAL)).to.throw();
    }
    const invalid = [
      ['--pkg=./local.ts'],
      ['unexpected'],
      ['--pi-version'],
      ['--pi-version=1.2.3', '--pi-version=2.3.4'],
    ];
    for (const args of invalid) {
      expect(() => selectHost(args, CANONICAL)).to.throw();
    }
    expect(() => selectHost([], 'npm:other-package@1.2.3')).to.throw();
  });

  it('owner npm-bin argv → frozen offline child; native escape lanes denied', () => {
    const root = Fs.resolve('fixture');
    const owner = [
      'run',
      '--no-prompt',
      '--no-lock',
      '--node-modules-dir=none',
      '--allow-env',
      '--allow-net',
      '--allow-run',
      '--allow-ffi=/fixture/cache',
      CANONICAL,
      '--no-extensions',
      '--mode',
      'rpc',
      '--offline',
    ];
    const original = [...owner];
    const result = isolateHostArgs(owner, CANONICAL, root);
    expect(owner).to.eql(original);
    expect(result.slice(result.indexOf(CANONICAL))).to.eql(owner.slice(owner.indexOf(CANONICAL)));
    expect(result.slice(0, result.indexOf(CANONICAL))).to.include.members([
      '--no-prompt',
      '--node-modules-dir=none',
      '--frozen',
      '--cached-only',
      '--deny-import',
      '--deny-net',
      '--deny-run',
      '--deny-ffi',
      `--config=${Fs.join(root, 'deno.json')}`,
      `--lock=${Fs.join(root, 'deno.lock')}`,
    ]);
    expect(result).not.to.include('--no-lock');
    expect(() => isolateHostArgs(['run', CANONICAL], CANONICAL, root)).to.throw();
    expect(() => isolateHostArgs(owner, 'npm:other@1.2.3', root)).to.throw();
  });
});
