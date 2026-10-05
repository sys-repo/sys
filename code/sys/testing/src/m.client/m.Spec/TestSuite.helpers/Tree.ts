import { Is } from './Is.ts';
import { ResultTree as Results } from './ResultTree.ts';
import { TestTree as Tests } from './TestTree.ts';

export const Tree: Readonly<{
  Is: typeof Is;
  Tests: typeof Tests;
  Results: typeof Results;
}> = Object.freeze({
  Is,
  Tests,
  Results,
});
