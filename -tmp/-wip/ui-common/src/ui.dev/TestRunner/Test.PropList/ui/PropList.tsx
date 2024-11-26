import { PropList as Base, DEFAULTS, type t } from '../common';
import { FieldTestsRun } from '../fields/TestsRun';
import { FieldTestsSelector } from '../fields/TestsSelector';
import { FieldTestsSelectorReset } from '../fields/TestsSelector.Reset';
import { useKeyboard } from '../hooks/useKeyboard';
import { useSuites } from '../hooks/useSuites';

export type TestPropListProps = {
  title?: t.PropListProps['title'];
  width?: t.PropListProps['width'];
  fields?: t.TestRunnerField[];
  data?: t.TestPropListData;
  margin?: t.CssEdgesInput;
  theme?: t.CommonTheme;
  enabled?: boolean;
  style?: t.CssValue;
};

export const PropList: React.FC<TestPropListProps> = (props) => {
  const { theme, data = {}, enabled = true, fields = DEFAULTS.fields.default } = props;
  const { pkg } = data;
  const title = Base.Wrangle.title(props.title);

  const { groups } = useSuites({ data });
  useKeyboard({ data, groups, enabled });

  const items = Base.builder<t.TestRunnerField>()
    .field('Module', { label: 'Module', value: pkg?.name ?? '-' })
    .field('Module.Version', { label: 'Version', value: pkg?.version ?? '-' })
    .field('Tests.Run', () => FieldTestsRun({ fields, data, enabled, theme }))
    .field('Tests.Selector', () => FieldTestsSelector({ fields, data, groups, enabled, theme }))
    .field('Tests.Selector.Reset', () =>
      FieldTestsSelectorReset({ fields, data, groups, enabled, theme }),
    )
    .items(fields);

  return (
    <Base
      title={title}
      items={items}
      width={Base.Info.width(props)}
      theme={theme}
      margin={props.margin}
      style={props.style}
    />
  );
};
