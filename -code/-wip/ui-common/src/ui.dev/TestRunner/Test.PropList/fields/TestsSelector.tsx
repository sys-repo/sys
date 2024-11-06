import { Color, type t } from '../common';
import { SpecsRow } from '../ui/ui.Row';

/**
 * Spec selector rows.
 */
export function FieldTestsSelector(args: {
  fields: t.TestRunnerField[];
  data: t.TestPropListData;
  groups: t.TestSuiteGroup[];
  enabled: boolean;
  theme?: t.CommonTheme;
}): t.PropListItem[] {
  const { data, groups } = args;
  const theme = Color.theme(args.theme);
  const run = data?.run ?? {};
  const specs = data?.specs ?? {};
  const res: t.PropListItem[] = [];

  let _lastTitle = '';

  groups.forEach((group) => {
    const title = group.title;
    group.suites.forEach((suite) => {
      const isDifferentTitle = title !== _lastTitle;
      _lastTitle = title;

      /**
       * Row → Suite (Selector)
       */
      const el = (
        <SpecsRow
          data={data}
          suite={suite}
          title={isDifferentTitle ? title : ''}
          indent={title ? 10 : undefined}
          enabled={args.enabled}
          theme={theme}
          onSelectionChange={specs.onSelect}
          onRunClick={run?.onRunSingle}
        />
      );

      res.push({ value: el });
    });
  });

  return res;
}
