import { useCallback, useState } from 'react';
import type { t } from './common.ts';

export function useBrowserController(
  args: t.Dist.Browser.Controller.Args = {},
): t.Dist.Browser.Controller.Instance {
  const { selectedPath: controlledPath, onSelect: externalOnSelect } = args;
  const isControlled = controlledPath !== undefined;

  type P = t.StringPath;
  const [uncontrolledPath, setUncontrolledPath] = useState<P | undefined>(() => controlledPath);
  const selectedPath = isControlled ? controlledPath : uncontrolledPath;

  const onSelect = useCallback<t.DistBrowserSelectHandler>(
    (e) => {
      if (!isControlled) setUncontrolledPath(e.path);
      externalOnSelect?.(e);
    },
    [isControlled, externalOnSelect],
  );

  return {
    selectedPath,
    onSelect,
  };
}
