import { describe, expect, it } from '../../-test.ts';
import { classifyPath } from '../u.classify.ts';
import { DEFAULTS } from '../u.defaults.ts';

describe(`Workspace.Info.classifyPath`, () => {
  it('classifies basename test forms as unit tests', () => {
    const paths = [
      'src/.test.ts',
      'src/-.test.ts',
      'src/foo.test.ts',
      'src/foo-test.ts',
      'src/foo_test.tsx',
    ];

    for (const path of paths) expect(classifyPath(path)).to.eql('unit-test');
  });

  it('classifies test directory forms as unit tests', () => {
    const paths = [
      'src/-test/helper.ts',
      'src/-test.external/fixture.ts',
      'src/__tests__/fixture.tsx',
      'src\\-test\\fixture.ts',
    ];

    for (const path of paths) expect(classifyPath(path)).to.eql('unit-test');
  });

  it('classifies spec directory forms as ui spec tests', () => {
    const paths = [
      'src/-spec/-SPEC.tsx',
      'src/-spec/common.ts',
      'src/-spec.debug/fixture.tsx',
      'src\\-spec\\fixture.tsx',
    ];

    for (const path of paths) expect(classifyPath(path)).to.eql('ui-spec-test');
  });

  it('does not classify broad test or spec substrings', () => {
    const paths = [
      'code/sys/testing/src/mod.ts',
      'src/m.Spec/runtime.ts',
      'src/specific/mod.ts',
      'src/-specific/mod.ts',
      'src/-spectator/mod.ts',
      'src/-testing/mod.ts',
    ];

    for (const path of paths) expect(classifyPath(path)).to.eql('source');
  });

  it('uses caller-provided rules without mutating defaults', () => {
    const rules = [
      {
        kind: 'ui-spec-test' as const,
        directorySegments: { exact: ['-ui-harness'] },
      },
    ];

    expect(classifyPath('src/-ui-harness/panel.tsx', rules)).to.eql('ui-spec-test');
    expect(classifyPath('src/-ui-harness/panel.tsx')).to.eql('source');
    expect(DEFAULTS.testPathRules.length).to.eql(2);
  });

  it('prefers the first matching rule', () => {
    expect(classifyPath('src/-spec/foo.test.ts')).to.eql('ui-spec-test');
  });
});
