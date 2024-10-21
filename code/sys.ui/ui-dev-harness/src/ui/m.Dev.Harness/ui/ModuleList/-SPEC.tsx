import { ModuleList } from './mod.ts';
import { BADGES, COLORS, Pkg, Spec, type t } from '../../-test.ts';

export default Spec.describe('ModuleList', (e) => {
  e.it('init', async (e) => {
    const ctx = Spec.ctx(e);

    let theme: t.CommonTheme | undefined;
    theme = 'Light';
    theme = 'Dark';
    const isDark = theme === 'Dark';

    ctx.debug.width(0);
    ctx.subject
      .size('fill', 100)
      .backgroundColor(isDark ? COLORS.DARK : 1)
      .render(async (e) => {
        const { SampleSpecs, ModuleSpecs } = await import('../../test.ui/entry.Specs');

        const fn = () => import('../../test.ui/sample.specs/-SPEC.MySample');
        const specs = {
          ...SampleSpecs,
          ...ModuleSpecs,
          foo: fn,
          'foo.bar.baz.zoo.foo.foo.bar.baz.zoo.foo.zoo.bar.foo.zoo.bar': fn, // NB: test ellipsis (...) overflow.
        };

        const NUMBERS = ['one', 'two', 'three', 'four'];
        const add = (key: string) => ((specs as t.SpecImports)[key] = fn);
        const addSamples = (prefix: string) => NUMBERS.forEach((num) => add(`${prefix}.${num}`));

        addSamples('foo.bar');
        addSamples('foo.baz');
        add('zoo');

        return (
          <ModuleList
            title={Pkg.name}
            version={Pkg.version}
            badge={BADGES.ci.node}
            imports={specs}
            hrDepth={2}
            scroll={true}
            // enabled={false}
            // filter={'foo'}
            theme={theme}
            selectedIndex={0}
            onItemVisibility={(e) => console.info('⚡️ onItemVisibility', e)}
            onItemClick={(e) => console.info('⚡️ onItemClick', e)}
            onItemSelect={(e) => console.info('⚡️ onItemSelect', e)}
          />
        );
      });
  });
});
