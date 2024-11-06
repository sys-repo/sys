import { useRef } from 'react';
import { CmdBar } from '../CmdBar/mod.ts';
import type { t } from './common.ts';

export const SampleCmdBarStateful: React.FC<t.CmdBarStatefulProps> = (props) => {
  /**
   * Example [useRef].
   */
  const ref = useRef<t.CmdBarRef>(null);
  return <CmdBar.Stateful ref={ref} {...props} />;
};
