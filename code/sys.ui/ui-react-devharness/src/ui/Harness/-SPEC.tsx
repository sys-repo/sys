// @ts-types="@types/react"
import React from 'react';
import { Spec } from '../../-test.ts';
import { Harness } from './mod.ts';

export default Spec.describe('Harness', (e) => {
  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    const bundle = import('../../-test/sample.specs/-SPEC.MySample.tsx');

    ctx.subject
      .size('fill')
      .display('flex')
      .render((e) => {
        return (
          <Harness
            style={{ Absolute: 0 }}
            spec={() => bundle}
            // spec={bundle} // NB: This is the same as the line above.
          />
        );
      });
  });
});
