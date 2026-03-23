import { type t, describe, expect, it } from '../../../-test.ts';
import { Esm } from '../mod.ts';

describe('Esm', () => {
  describe('Esm.Modules', () => {
    describe('create:', () => {
      it('empty', () => {
        type T = Parameters<t.EsmModulesLib['create']>[0];
        const test = (input?: T) => {
          const modules = Esm.modules(input);
          expect(modules.count).to.eql(0);
          expect(modules.items.length).to.eql(0);
          expect(modules.ok).to.eql(true);
          expect(modules.error).to.eql(undefined);
        };
        test();
        test([]);
      });

      it('from: string[]', () => {
        const input = ['foobar', 'jsr:foobar@1/subpath', 'npm:@foo/bar@1.2.3/subpath'];
        const modules = Esm.modules(input);
        expect(modules.ok).to.eql(true);
        expect(modules.error).to.eql(undefined);
        expect(modules.count).to.eql(3);
        expect(modules.items.length).to.eql(modules.count);
        expect(modules.items.map((m) => m.name)).to.eql(['foobar', 'foobar', '@foo/bar']);
        expect(modules.items.map((m) => m.toString())).to.eql(input);
      });

      it('from: <EsmImport>[]', () => {
        const a = Esm.parse('jsr:foobar@1');
        const b = Esm.parse('npm:@foo/bar@1.2.3/subpath');
        const modules = Esm.modules([a, b]);
        expect(modules.ok).to.eql(true);
        expect(modules.error).to.eql(undefined);
        expect(modules.count).to.eql(2);
        expect(modules.items[0]).to.eql(a);
        expect(modules.items[1]).to.eql(b);
        expect(modules.items[0]).to.not.equal(a);
        expect(modules.items[1]).to.not.equal(b);
      });

      it('from: mixed', () => {
        const mod = Esm.parse('npm:@foo/bar@1.2.3');
        const modules = Esm.modules(['jsr:foobar@1', 'npm:@foo/bar@1.2.3', mod]);
        expect(modules.ok).to.eql(true);
        expect(modules.error).to.eql(undefined);
        expect(modules.count).to.eql(3);
        expect(modules.items.map((m) => m.name)).to.eql(['foobar', '@foo/bar', mod.name]);
      });

      describe('errors', () => {
        it('module parse error', async () => {
          const fail = 'FAIL:@foo/bar@1.2.3';
          const modules = Esm.modules(['foobar', fail, 'jsr:foobar@1']);
          expect(modules.count).to.eql(3);
          expect(modules.ok).to.eql(false);
          expect(modules.error?.message).to.include('Failed to parse ESM module-specifier');
          expect(modules.error?.message).to.include(fail);
        });
      });
    });

    describe('modules.latest: (version)', () => {
      describe('param: string (semver)', () => {
        const specifiers = [
          'jsr:foobar',
          'rxjs@7',
          'npm:@foo/bar@1.2.3',
          Esm.parse(' npm:@foo/bar@~1.2.4 '),
        ];

        it('empty (no match)', () => {
          const modules = Esm.modules(specifiers);
          expect(modules.latest('')).to.eql('');
          expect(modules.latest('  ')).to.eql('');
          expect(modules.latest('bam')).to.eql('');
          expect(modules.latest('@foo')).to.eql('');
          expect(modules.latest('npm:@foo/boo')).to.eql('');
        });

        it('match: string', () => {
          const modules = Esm.modules(specifiers);
          const test = (input: string, expected: string) => {
            const res = modules.latest(input);
            expect(res).to.eql(expected, input);
          };
          test('@foo/bar', '~1.2.4');
          test('  @foo/bar  ', '~1.2.4');
          test('npm:@foo/bar', '~1.2.4');
          test('npm:@foo/bar@1.2.3', '~1.2.4');
          test('rxjs', '7');
        });

        it('no version → empty ("")', () => {
          const modules = Esm.modules(specifiers);
          expect(modules.latest(' jsr:foobar ')).to.eql('');
        });
      });

      describe('param: {EsmImportMap}', () => {
        it('empty', () => {
          const modules = Esm.modules(['rxjs@^7.2', 'jsr:@sys/tmp@0.0.10', 'foo@2']);
          const deps: t.EsmImportMap = {};
          const res = modules.latest(deps);
          expect(res).to.eql(deps);
          expect(res).to.not.equal(deps);
        });

        it('adjust', () => {
          const specifiers = ['rxjs@^7.2', 'jsr:@sys/tmp@0.0.10', 'npm:@foo/bar@~1.2.4', 'foo@2'];
          const modules = Esm.modules(specifiers);
          const deps: t.EsmImportMap = {
            '@foo/bar': 'npm:@foo/bar@^1.2.3',
            '@scope/name': 'jsr:@scope/name@^0.0.10',
            rxjs: '>=6.5-alpha.1',
            foo: '3.2',
          };

          const res = modules.latest(deps);
          expect(res['@foo/bar']).to.eql('npm:@foo/bar@~1.2.4');
          expect(res['@scope/name']).to.eql('jsr:@scope/name@^0.0.10');
          expect(res['rxjs']).to.eql('^7.2');
          expect(res['foo']).to.eql('3.2');
        });

        it('empty version values', () => {
          const specifiers = [
            'jsr:@scope/name@0.0.10',
            'npm:@foo/bar@~1.2.4',
            'foo@2',
          ];
          const modules = Esm.modules(specifiers);
          const deps: t.EsmImportMap = {
            '@foo/bar': '',
            '@scope/name': 'jsr:@scope/name',
            foo: '  ',
          };

          const res = modules.latest(deps);
          expect(res['@foo/bar']).to.eql('~1.2.4');
          expect(res['@scope/name']).to.eql('jsr:@scope/name@0.0.10');
          expect(res['foo']).to.eql('2');
        });
      });
    });
  });
});
