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
            // hr={2}
            hr={(e) => {
              // e.depth(2);
              e.byRoots(['dev.sample', 'sys.ui.dev', 'foo.bar.', 'zoo']);
              // e.byRegex(/^foo\.bar\./); //   foo.bar.* stays together
              // hrSegmentExample(e);
            }}
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

/**
 * Samples:
 */
const hrSegmentExample: t.ModuleListShowHr = (e) => {
  const topPrev = e.segment(e.prev, 0); // segment depth‑0
  const secondPrev = e.segment(e.prev, 1); // segment depth‑1
  const secondNext = e.segment(e.next, 1);

  // Match:
  if (topPrev === 'sys' && secondPrev !== secondNext) return true;

  // Fall back to depth‑2 grouping for everything else.
  e.depth(2);
};
