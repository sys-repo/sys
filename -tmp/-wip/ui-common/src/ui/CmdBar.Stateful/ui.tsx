import { View as CmdBar } from '../CmdBar/ui';
import { Ctrl, type t } from './common';
import { useController } from './use.Controller';

export const View: React.FC<t.CmdBarStatefulProps> = (props) => {
  const controller = useController(props);
  const ctrl = controller.ctrl;
  const cmd = ctrl ? Ctrl.toCmd(ctrl) : undefined;
  return (
    <CmdBar
      {...props}
      {...controller.handlers}
      cmd={cmd}
      text={controller.text}
      hintKey={controller.hintKey}
      enabled={controller.enabled}
      spinning={controller.spinning}
      readOnly={controller.readOnly}
    />
  );
};
