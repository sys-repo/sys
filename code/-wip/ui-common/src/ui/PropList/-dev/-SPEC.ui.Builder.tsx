import { PropList } from '../mod.ts';
import { SampleFields as Fields, type MyField } from './common.ts';
const pkg = { name: 'foobar', version: '1.2.3' } as const;

export const BuilderSample = {
  Fields,

  toItems(args: { fields?: MyField[] }) {
    const { fields = Fields.defaults } = args;
    return PropList.builder<MyField>()
      .field('Module', { label: 'Module', value: `${pkg.name}@${pkg.version}` })
      .field('Module.Name', { label: 'Name', value: pkg.name })
      .field('Module.Version', { label: 'Version', value: pkg.version })
      .field('Module.Version.Diff', { label: 'Version', value: 'diff' })
      .field('Factory', () => ({ label: 'Factory', value: 123 }))
      .field('Factory.None', () => undefined)
      .field('Factory.Many', () => [
        { label: 'One', value: 123 },
        { label: 'Two', value: 456 },
        { label: 'Three', value: 789 },
      ])
      .field('Factory.EmptyArray', () => [])
      .field('Factory.Mixed', () => [undefined, { label: 'Foo' }, undefined])
      .items(fields);
  },
};
