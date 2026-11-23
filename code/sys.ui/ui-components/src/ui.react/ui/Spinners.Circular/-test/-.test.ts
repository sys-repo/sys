import { Spinners } from '@sys/ui-components/react/spinners';
import { describe, expect, it } from '../../../-test.ts';
import { CircularSpinner } from '../mod.ts';

describe('Spinners.Circular', () => {
  it('exposes the module renderer directly', () => {
    expect(Spinners.Circular).to.equal(CircularSpinner.UI);
  });
});
