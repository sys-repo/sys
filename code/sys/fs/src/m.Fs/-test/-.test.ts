import * as StdFs from '@std/fs';

import { describe, expect, it } from '../../-test.ts';
import { Glob } from '../../m.Glob/mod.ts';
import { Path } from '../common.ts';
import { Fs } from '../mod.ts';

describe('Fs: filesystem', () => {
  it('API', () => {
    expect(Fs.glob).to.equal(Glob.create);
    expect(Fs.ls).to.equal(Glob.ls);
    expect(Fs.trimCwd).to.equal(Path.trimCwd);

    expect(Fs.ensureDir).to.eql(StdFs.ensureDir);
    expect(Fs.ensureSymlink).to.eql(StdFs.ensureSymlink);
    expect(Fs.move).to.eql(StdFs.move);
  });

  describe('Fs.cwd', () => {
    it('returns the CWD', () => {
      expect(Fs.cwd()).to.eql(Deno.cwd());
      expect(Fs.cwd('process')).to.eql(Deno.cwd());
    });

    it('returns the initiating terminal CWD', () => {
      const dir = Fs.cwd('terminal');
      expect(dir).to.eql(Deno.env.get('INIT_CWD'));
    });
  });
});
