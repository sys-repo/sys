import { DEFAULTS, PropList, type t } from '../common';

export type PropListFieldSelectorProps = t.PropListFieldSelectorProps<t.TestRunnerField>;
export const PropListFieldSelector: React.FC<PropListFieldSelectorProps> = (props) => {
  return (
    <PropList.FieldSelector
      {...props}
      all={props.all ?? DEFAULTS.fields.all}
      selected={props.selected ?? DEFAULTS.fields.default}
      theme={props.theme}
    />
  );
};
