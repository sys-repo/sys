import { pkg, type t } from '../common.ts';

export { Switch } from '../../../ui/Button.Switch/mod.ts';
export { PropList } from '../../../ui/PropList/mod.ts';
export { Theme } from '../../DevTools/Helpers.Theme.tsx';
export * from '../common.ts';

/**
 * Constants
 */

const keyboard: t.TestPropListKeyboard = {
  run: 'Enter',
  runAll: 'ALT + Enter',
  selectAllToggle: 'ALT + KeyA',
};

export const DEFAULTS = {
  displayName: {
    TestPropList: `${pkg.name}.TestPropList`,
  },
  ellipsis: true,
  colorDelay: 1000 * 8,
  keyboard,
  fields: {
    get all(): t.TestRunnerField[] {
      return ['Module', 'Module.Version', 'Tests.Run', 'Tests.Selector', 'Tests.Selector.Reset'];
    },
    get default(): t.TestRunnerField[] {
      return ['Tests.Run', 'Tests.Selector', 'Tests.Selector.Reset'];
    },
  },
} as const;
