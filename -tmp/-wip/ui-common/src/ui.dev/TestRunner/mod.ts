import { TestPropList } from './Test.PropList/mod.ts';
import { TestResults } from './Test.Results/mod.ts';
import { Test } from './common.ts';

export const TestRunner = {
  Results: TestResults,
  PropList: TestPropList,
  bundle: Test.bundle,
} as const;

export { TestResults, TestPropList };
export default TestRunner;
