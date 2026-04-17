import { describe, expect, it } from '../../../-test.ts';
import { DEFAULT_PACKAGE_RULES } from '../u.rules.ts';

describe('OptimizeImportsPlugin.DEFAULT_PACKAGE_RULES', () => {
  it('remains empty until a derived package rule dataset is supplied', () => {
    expect(DEFAULT_PACKAGE_RULES).to.eql([]);
  });
});
