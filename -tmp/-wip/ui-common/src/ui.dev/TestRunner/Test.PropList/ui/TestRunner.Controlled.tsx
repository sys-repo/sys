import { type t } from '../common';
import { useController } from '../hooks/useController';
import { TestRunner, type TestRunnerProps } from './TestRunner';

export type TestRunnerControlledProps = Omit<TestRunnerProps, 'data'> & {
  initial?: t.TestPropListData;
  theme?: t.CommonTheme;
  onChanged?: t.TestPropListChangeHandler;
};

export const TestRunnerControlled: React.FC<TestRunnerControlledProps> = (props) => {
  const { initial, onChanged, theme } = props;
  const controller = useController({ initial, onChanged });
  return <TestRunner {...props} data={controller.data} theme={theme} />;
};
