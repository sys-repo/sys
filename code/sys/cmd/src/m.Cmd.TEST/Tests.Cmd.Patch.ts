import { Cmd } from '../mod.ts';
import type { t } from './common.ts';

const Patch = Cmd.Patch;

export function patchTests(setup: t.CmdTestSetup, args: t.TestArgs) {
  const { describe, it, expect } = args;

  describe('Cmd.Patch', () => {
    describe('Path.path: ensure path is an array', () => {
      it('invalid input', () => {
        const values = [123, '', true, {}, [], BigInt(0), Symbol('foo'), null, undefined];
        values.forEach((value: any) => expect(Patch.path(value)).to.eql([]));
      });

      it('from array (no change)', () => {
        const path: t.ObjectPath = ['foo', 'bar'];
        const patch: t.CmdPatch = { path };
        const res = Patch.path(patch);
        expect(res).to.equal(path);
      });

      it('from string', () => {
        const test = (path: string, expected: t.ObjectPath) => {
          const res = Patch.path({ path });
          expect(res).to.eql(expected);
        };

        test('', []);
        test('  ', []);
        test(' /// ', []);
        test('foo', ['foo']);
        test('  foo  ', ['foo']);
        test('foo/bar', ['foo', 'bar']);
        test('/foo/bar', ['foo', 'bar']);
        test('/foo/bar/', ['foo', 'bar']);
        test('foo/bar/', ['foo', 'bar']);
        test(' /foo/bar ', ['foo', 'bar']);
        test(' foo/bar ', ['foo', 'bar']);
        test(' ///foo/bar/// ', ['foo', 'bar']);
        test(' / foo /bar ', [' foo ', 'bar']); // NB: trims whitespace from root path only (protects inner parts).
      });
    });
  });
}
