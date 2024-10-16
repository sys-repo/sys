import type { t } from './common.ts';
import { Is } from './Is.ts';
import { TestTree } from './TestTree.ts';

type T = t.TestSuiteModel | t.TestModel;
type M = t.TestModifier;

/**
 * Helpers for working with ".skip" and ".only"
 * constraints accross a Suite of Tests.
 */
export const Constraints = {
  /**
   * Scan a suite of tests looking for the specified constraint modifiers.
   */
  scan(root: t.TestSuiteModel | undefined, modifier: M | M[]) {
    if (!root) return [];

    const modifiers = Array.isArray(modifier) ? modifier : [modifier];
    const includes = (modifier?: M) => (!modifier ? false : modifiers.includes(modifier));

    const list: T[] = [];
    const add = (item?: T) => {
      if (item && !exists(list, item)) list.push(item);
    };

    TestTree.walkDown(root, (e) => {
      if (includes(e.suite.state.modifier)) add(e.suite);
      if (includes(e.test?.modifier)) add(e.test);
    });

    return list;
  },

  /**
   * Determine if the given item is skipped (anywhere in it's hierarchy).
   */
  isSkipped(item?: T) {
    if (!item) return false;
    if (toModifier(item) === 'skip') return true;
    return withinParentModifier(item, 'skip');
  },

  /**
   * Determine if the item is flagged as ".only" or is included
   * within a ".only" set anywhere within it's hierarhcy.
   */
  isWithinOnlySet(item?: T) {
    if (!item) return false;
    if (toModifier(item) === 'skip') return false;
    if (Constraints.isSkipped(item)) return false; // NB: Skipped somewhere in parent hierarchy.
    if (hasSiblingWithModifer(item, 'only') && toModifier(item) !== 'only') return false;
    if (toModifier(item) === 'only') return true;
    return withinParentModifier(item, 'only', {
      rejectMatchWhen: (e) => hasSiblingWithModifer(e.suite, 'only'),
    });
  },

  /**
   * Generate a set of [TestModifier] flags indicating if/how a test
   * is excluded from execution (via ".skip" or ".only" constraints).
   */
  exclusionModifiers(item?: T) {
    const exclusions: t.TestModifier[] = [];
    const treeContainsOnlyFlag = Constraints.scan(TestTree.root(item), 'only').length > 0;
    if (Constraints.isSkipped(item)) exclusions.push('skip');
    if (treeContainsOnlyFlag && !Constraints.isWithinOnlySet(item)) exclusions.push('only');
    return exclusions;
  },
};

/**
 * Helpers
 */

function exists(list: T[], match: T) {
  return list.some((item) => item.id === match.id);
}

function toModifier(item: T): t.TestModifier | undefined {
  if (Is.suite(item)) return (item as t.TestSuiteModel).state.modifier;
  if (Is.test(item)) return (item as t.TestModel).modifier;
  return undefined;
}

function withinParentModifier(
  item: T,
  modifier: t.TestModifier,
  options: { rejectMatchWhen?: (e: t.SuiteWalkUpArgs) => boolean } = {},
) {
  let result = false;
  TestTree.walkUp(item, (e) => {
    const rejected = options.rejectMatchWhen?.(e);
    if (rejected) return e.stop();
    if (e.suite.state.modifier === modifier) {
      result = true;
      e.stop();
    }
  });
  return result;
}

function hasSiblingWithModifer(item: T, modifier: t.TestModifier) {
  const siblings = TestTree.siblings(item);
  return siblings.some((item) => toModifier(item) === modifier);
}
