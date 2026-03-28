import { describe, expect, it } from '../../../-test.ts';
import { Esm } from '../mod.ts';

describe('Esm', () => {
  describe('Esm.toString', () => {
    it('Esm.toString', () => {
      const test = (input: string) => {
        const mod = Esm.parse(input);
        const res = Esm.toString(mod);
        expect(mod.error).to.eql(undefined, input);
        expect(res).to.eql(input);
      };
      test('jsr:@scope/name@^0.0.42');
      test('jsr:@scope/name');
      test('jsr:@scope/name/foo');
      test('jsr:@scope/name@1.2/foo');
      test('rxjs');
      test('rxjs/foo/bar');
      test('rxjs@7');
      test('rxjs@7/foobar');
      test('npm:rxjs@7');
    });

    it('options: part replacements', () => {
      const input = 'jsr:@sys/tmp@^0.0.42';
      const mod = Esm.parse(input);

      const a = Esm.toString(mod);
      const b = Esm.toString(mod, { registry: '' });
      const c = Esm.toString(mod, { registry: 'npm' });
      const d = Esm.toString(mod, { name: '  foo  ' });
      const e = Esm.toString(mod, { version: ' 1.2-alpha.1 ' });
      const f = Esm.toString(mod, { registry: 'npm', name: 'rxjs', version: '7' });
      const g = Esm.toString(mod, { subpath: ' //foo/bar ' });

      expect(a).to.eql(input);
      expect(b).to.eql('@sys/tmp@^0.0.42');
      expect(c).to.eql('npm:@sys/tmp@^0.0.42');
      expect(d).to.eql('jsr:foo@^0.0.42');
      expect(e).to.eql('jsr:@sys/tmp@1.2-alpha.1');
      expect(f).to.eql('npm:rxjs@7');
      expect(g).to.eql('jsr:@sys/tmp@^0.0.42/foo/bar');
    });
  });
});
