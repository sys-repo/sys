import { type t } from './common';
import { TestRunnerLabel } from './ui/Label';
import { TestRunnerControlled } from './ui/TestRunner.Controlled';

type D = t.TestPropListData;
type R = t.TestPropListRunData;

/**
 * <PropList> compact test-runner.
 */
export const Item = {
  /**
   * Generates a <PropList> item for running unit tests.
   */
  runner(args: {
    modules?: D['modules'];
    ctx?: R['ctx'];
    label?: R['label'];
    infoUrl?: R['infoUrl'];
    theme?: t.CommonTheme;
  }): t.PropListItem {
    const { modules, ctx, theme } = args;
    const data: t.TestPropListData = { modules, run: { ctx } };
    return {
      label: <TestRunnerLabel label={args.label} infoUrl={args.infoUrl} theme={theme} />,
      value: <TestRunnerControlled initial={data} theme={theme} />,
    };
  },
};
