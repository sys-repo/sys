// @ts-types="@types/react"
import React from 'react';
import { Badges, COLORS, pkg, Spec, type t } from '../../-test.ts';
import { ModuleList } from './mod.ts';

export default Spec.describe('ModuleList', (e) => {
  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    let theme: t.CommonTheme | undefined;
    theme = 'Light';
    theme = 'Dark';
    const isDark = theme === 'Dark';

    ctx.debug.width(0);
    ctx.subject
      .size('fill', 100)
      .backgroundColor(isDark ? COLORS.DARK : 1)
      .render(async () => {
        const { SampleSpecs, ModuleSpecs } = await import('../../-test/entry.Specs.ts');

        const fn = () => import('../../-test/sample.specs/-SPEC.MySample.tsx');
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
            title={pkg.name}
            version={pkg.version}
            badge={Badges.ci.jsr}
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
