import { type t } from './common';
import { useController } from './hooks/useController';
import { PropList, type TestPropListProps } from './ui/PropList';

export type TestPropListControlledProps = Omit<TestPropListProps, 'data'> & {
  initial?: t.TestPropListData;
  onChanged?: t.TestPropListChangeHandler;
};

export const TestPropListControlled: React.FC<TestPropListControlledProps> = (props) => {
  const { initial, onChanged } = props;
  const controller = useController({ initial, onChanged });
  return <PropList {...props} data={controller.data} />;
};
