import { describe, expect, it } from '../../../-test.ts';

import { Slug } from '../../mod.ts';
import { Validation } from '../mod.ts';

describe('schema.validation', () => {
  it('API', () => {
    expect(Slug.Validation).to.equal(Validation);
  });
});
