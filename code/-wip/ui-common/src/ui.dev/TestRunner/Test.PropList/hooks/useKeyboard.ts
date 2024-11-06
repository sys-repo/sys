import { useEffect } from 'react';
import { Hash, Keyboard, type t } from '../common.ts';
import { Util } from '../u.ts';

/**
 * Manages keyboard shortcuts for the test runner.
 */
export function useKeyboard(args: {
  data: t.TestPropListData;
  groups: t.TestSuiteGroup[];
  enabled?: boolean;
}) {
  const { data, groups, enabled = true } = args;
  const keyboard = Wrangle.patterns(data);
  const selected = data.specs?.selected ?? [];
  const selectedHash = Hash.sha1(selected);
  const patternsHash = Wrangle.patternsHash(data);
  const groupsHash = Wrangle.groupsHash(groups);
  const deps = [enabled, patternsHash, groupsHash];

  type P = t.TestPropListKeyboardPattern | undefined;
  type F = t.KeyMatchSubscriberHandler;
  type D = () => void;
  const handlePattern = (input: P, fn: F): D[] => {
    if (!enabled) return [];

    const pattern = ((typeof input === 'function' ? input() : input) || '').trim();
    if (!pattern) return [];

    const handler = Keyboard.on(pattern, fn);
    return [handler.dispose];
  };

  /**
   * Run triggers.
   */
  useEffect(() => {
    const dispose: D[] = [];
    const handle = (input: P, fn: F) => dispose.push(...handlePattern(input, fn));

    /**
     * Run selected.
     */
    handle(keyboard.run, (e) => {
      if (!enabled) return;
      e.handled();
      const modifiers = { ...Wrangle.modifiers(), meta: false };
      data.run?.onRunAll?.({ modifiers });
    });

    /**
     * Run all (force).
     */
    handle(keyboard.runAll, (e) => {
      if (!enabled) return;
      e.handled();
      const modifiers = { ...Wrangle.modifiers(), meta: true };
      data.run?.onRunAll?.({ modifiers });
    });

    return () => dispose.forEach((fn) => fn());
  }, deps);

  /**
   * Select triggers.
   */
  useEffect(() => {
    const dispose: D[] = [];
    const handle = (input: P, fn: F) => dispose.push(...handlePattern(input, fn));

    const select = (select: t.SpecsSelectionResetHandlerArgs['select']) => {
      const specs = data.specs ?? {};
      const modifiers = Wrangle.modifiers();
      specs.onReset?.({ modifiers, select });
    };

    /**
     * Select all (toggle)
     */
    handle(keyboard.selectAllToggle, (e) => {
      e.handled();
      select(Util.isAllSelected(data, groups) ? 'none' : 'all');
    });

    /**
     * Select all (explicit)
     */
    handle(keyboard.selectAll, (e) => {
      e.handled();
      select('all');
    });

    /**
     * Select none (explicit)
     */
    handle(keyboard.selectNone, (e) => {
      e.handled();
      select('none');
    });

    return () => dispose.forEach((fn) => fn());
  }, [...deps, selectedHash]);
}

/**
 * Helpers
 */
const Wrangle = {
  modifiers(): t.KeyboardModifierFlags {
    return {
      shift: false,
      ctrl: false,
      alt: false,
      meta: false,
    };
  },

  patterns(data: t.TestPropListData) {
    const keyboard = data?.keyboard ?? {};
    return {
      run: Wrangle.pattern(keyboard.run),
      runAll: Wrangle.pattern(keyboard.runAll),
      selectAllToggle: Wrangle.pattern(keyboard.selectAllToggle),
      selectAll: Wrangle.pattern(keyboard.selectAll),
      selectNone: Wrangle.pattern(keyboard.selectNone),
    };
  },

  pattern(input?: t.TestPropListKeyboardPattern) {
    return typeof input === 'function' ? input() : input;
  },

  patternsHash(data: t.TestPropListData) {
    const keyboard = Wrangle.patterns(data);
    const patterns = Object.entries(keyboard).map(([key, value]) => `${key}:${value}`);
    return Hash.sha1(patterns);
  },

  groupsHash(groups: t.TestSuiteGroup[]) {
    const suites = Util.groupsToSuites(groups);
    const hashes = suites.map((suite) => suite.hash());
    return Hash.sha1(hashes);
  },
};
