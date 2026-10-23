import { describe, expect, it } from '../-test.ts';
import { Loading, ValidationErrors } from './mod.ts';

describe(`UI`, () => {
  it('API', async () => {
    const m = await import('@sys/ui-factory/components/react');
    expect(m.Loading).to.equal(Loading);
    expect(m.ValidationErrors).to.equal(ValidationErrors);
  });
});
