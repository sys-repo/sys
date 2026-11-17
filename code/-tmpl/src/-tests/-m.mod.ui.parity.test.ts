import { describe, expect, Fs, it, makeTmpl, Path } from '../-test.ts';

const source = Path.fromFileUrl(new URL('../../-templates/', import.meta.url));
const cases = [
  {
    name: 'm.mod.ui',
    paths: ['-spec/-SPEC.tsx', '-spec/-SPEC.Debug.tsx', '-spec/-t.ts', 'ui.tsx', 'use.Styles.ts'],
  },
  {
    name: 'm.mod.ui.controller',
    paths: ['-spec/-SPEC.tsx', '-spec/-SPEC.Debug.tsx', '-spec/-t.ts'],
  },
  { name: 'pkg', paths: ['src/common/t.ts'] },
] as const;

describe('UI templates: embedded/source parity', () => {
  for (const { name, paths } of cases) {
    it(`${name} materialization → preserves authored sources`, async () => {
      const tmp = await Fs.makeTempDir({ prefix: 'tmpl.ui.parity-' });
      try {
        await (await makeTmpl(name)).write(tmp.absolute);
        for (const path of paths) {
          const authored = await Fs.readText(Fs.join(source, `tmpl.${name}`, path));
          const embedded = await Fs.readText(Fs.join(tmp.absolute, path));
          expect(authored.error, `${name}/${path}: authored source`).to.eql(undefined);
          expect(embedded.error, `${name}/${path}: embedded source`).to.eql(undefined);
          expect(authored.data, `${name}/${path}: source must exist`).to.be.a('string');
          expect(embedded.data, `${name}/${path}`).to.equal(authored.data);
        }
      } finally {
        await Fs.remove(tmp.absolute);
      }
    });
  }
});
